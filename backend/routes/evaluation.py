from flask import Blueprint, request, jsonify
from models import db, Mark, AnswerSheet, QuestionPaper
from services.gemini_ocr import GeminiOCRService
from services.pdf_processor import PDFProcessor
import base64
import io

evaluation_bp = Blueprint('evaluation', __name__)

# Initialize OCR service
ocr_service = GeminiOCRService()

@evaluation_bp.route('/auto-scan', methods=['POST'])
def auto_scan():
    """Automatically scan a full page for transcription and diagrams"""
    try:
        data = request.json
        answer_sheet_id = data.get('answersheetId')
        page_number = data.get('page', 0)
        
        # Get answer sheet
        answer_sheet = AnswerSheet.query.get_or_404(answer_sheet_id)
        
        # Convert full page to image (high res for OCR)
        image = PDFProcessor.pdf_page_to_image(
            answer_sheet.file_path,
            page_number,
            zoom=3.0 # High resolution for full page analysis
        )
        
        # Perform automatic analysis
        result = ocr_service.auto_analyze_page(image, is_path=False)
        
        # Process detected diagrams
        processed_diagrams = []
        for diag in result.get('diagrams', []):
            bbox = diag.get('bounding_box') # [ymin, xmin, ymax, xmax] in 0-1000
            if bbox and len(bbox) == 4:
                # Convert normalized [0-1000] to [0-1] for extract_region
                norm_coords = {
                    'y': bbox[0] / 1000.0,
                    'x': bbox[1] / 1000.0,
                    'height': (bbox[2] - bbox[0]) / 1000.0,
                    'width': (bbox[3] - bbox[1]) / 1000.0
                }
                
                try:
                    # Extract high-res region for diagram
                    diag_image = PDFProcessor.extract_region(
                        answer_sheet.file_path,
                        page_number,
                        norm_coords
                    )
                    
                    # Convert to base64
                    img_buffer = io.BytesIO()
                    diag_image.save(img_buffer, format='PNG')
                    diag_img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
                    
                    processed_diagrams.append({
                        'description': diag.get('description', 'Diagram'),
                        'image': f"data:image/png;base64,{diag_img_base64}"
                    })
                except Exception as ex:
                    print(f"Failed to extract diagram: {ex}")
        
        return jsonify({
            'transcription': result.get('transcription', ''),
            'diagrams': processed_diagrams,
            'success': result.get('success', False)
        }), 200
        
    except Exception as e:
        print(f"Error in auto-scan: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500

@evaluation_bp.route('/transcribe', methods=['POST'])
def transcribe():
    """Transcribe handwriting from a specific region of an answer sheet"""
    try:
        data = request.json
        answer_sheet_id = data.get('answersheetId')
        page_number = data.get('page', 0)
        coordinates = data.get('coordinates')
        
        # Get answer sheet
        answer_sheet = AnswerSheet.query.get_or_404(answer_sheet_id)
        
        # Convert PDF region to image
        if coordinates:
            image = PDFProcessor.extract_region(
                answer_sheet.file_path,
                page_number,
                coordinates
            )
        else:
            # Get full page if no coordinates
            image = PDFProcessor.pdf_page_to_image(
                answer_sheet.file_path,
                page_number
            )
        
        # Perform OCR
        result = ocr_service.process_pdf_region(image, None)
        
        # Convert image to base64 for sending back
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'transcription': result['transcription'],
            'diagram_info': result['diagram_info'],
            'image': f"data:image/png;base64,{img_base64}",
            'success': result['success']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@evaluation_bp.route('/extract-diagram', methods=['POST'])
def extract_diagram():
    """Extract diagrams from a specific region"""
    try:
        data = request.json
        answer_sheet_id = data.get('answersheetId')
        page_number = data.get('page', 0)
        coordinates = data.get('coordinates')
        
        # Get answer sheet
        answer_sheet = AnswerSheet.query.get_or_404(answer_sheet_id)
        
        # Extract region
        image = PDFProcessor.extract_region(
            answer_sheet.file_path,
            page_number,
            coordinates
        )
        
        # Analyze for diagrams
        diagram_info = ocr_service.extract_diagram(image, is_path=False)
        
        # Convert image to base64
        img_buffer = io.BytesIO()
        image.save(img_buffer, format='PNG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'diagram_info': diagram_info,
            'image': f"data:image/png;base64,{img_base64}",
            'success': True
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500

@evaluation_bp.route('/marks', methods=['POST'])
def save_marks():
    """Save marks for a specific question"""
    try:
        data = request.json
        answer_sheet_id = data.get('answersheetId')
        question_paper_id = data.get('questionPaperId')
        question_number = data.get('questionNumber')
        marks_awarded = data.get('marksAwarded')
        max_marks = data.get('maxMarks')
        
        # Validate inputs
        if not all([answer_sheet_id, question_number is not None, marks_awarded is not None, max_marks is not None]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if mark already exists
        existing_mark = Mark.query.filter_by(
            answer_sheet_id=answer_sheet_id,
            question_number=question_number
        ).first()
        
        if existing_mark:
            # Update existing mark
            existing_mark.marks_awarded = float(marks_awarded)
            existing_mark.max_marks = float(max_marks)
            existing_mark.question_paper_id = question_paper_id
        else:
            # Create new mark
            mark = Mark(
                answer_sheet_id=answer_sheet_id,
                question_paper_id=question_paper_id,
                question_number=question_number,
                marks_awarded=float(marks_awarded),
                max_marks=float(max_marks)
            )
            db.session.add(mark)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Marks saved successfully',
            'data': existing_mark.to_dict() if existing_mark else mark.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/marks/<int:answer_sheet_id>', methods=['GET'])
def get_marks(answer_sheet_id):
    """Get all marks for an answer sheet"""
    try:
        marks = Mark.query.filter_by(answer_sheet_id=answer_sheet_id).order_by(Mark.question_number).all()
        
        return jsonify({
            'marks': [mark.to_dict() for mark in marks]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/marks/<int:answer_sheet_id>/total', methods=['GET'])
def get_total_marks(answer_sheet_id):
    """Calculate total marks for an answer sheet"""
    try:
        marks = Mark.query.filter_by(answer_sheet_id=answer_sheet_id).all()
        
        total_awarded = sum(mark.marks_awarded for mark in marks)
        total_max = sum(mark.max_marks for mark in marks)
        
        return jsonify({
            'total_awarded': total_awarded,
            'total_max': total_max,
            'percentage': (total_awarded / total_max * 100) if total_max > 0 else 0
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/pdf-info/<int:answer_sheet_id>', methods=['GET'])
def get_pdf_info(answer_sheet_id):
    """Get PDF information (page count, etc.)"""
    try:
        answer_sheet = AnswerSheet.query.get_or_404(answer_sheet_id)
        page_count = PDFProcessor.get_page_count(answer_sheet.file_path)
        
        return jsonify({
            'page_count': page_count,
            'file_path': answer_sheet.file_path
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@evaluation_bp.route('/save-report', methods=['POST'])
def save_report():
    """Save final evaluation report"""
    try:
        data = request.json
        answer_sheet_id = data.get('answersheetId')
        remarks = data.get('remarks')
        
        if not answer_sheet_id:
            return jsonify({'error': 'Missing answer sheet ID'}), 400
            
        answer_sheet = AnswerSheet.query.get_or_404(answer_sheet_id)
        
        answer_sheet.remarks = remarks
        answer_sheet.status = 'evaluated'
        
        db.session.commit()
        
        return jsonify({
            'message': 'Report saved successfully',
            'data': answer_sheet.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/results', methods=['GET'])
def get_results():
    """Get all evaluated answer sheets with results"""
    try:
        # Fetch status='evaluated' sheets
        evaluated_sheets = AnswerSheet.query.filter_by(status='evaluated').all()
        
        results = []
        for sheet in evaluated_sheets:
            # Calculate total marks
            marks = Mark.query.filter_by(answer_sheet_id=sheet.id).all()
            total_awarded = sum(m.marks_awarded for m in marks)
            total_max = sum(m.max_marks for m in marks)
            percentage = (total_awarded / total_max * 100) if total_max > 0 else 0
            
            # Get Question Paper title
            qp = QuestionPaper.query.get(sheet.question_paper_id) if sheet.question_paper_id else None
            
            results.append({
                'id': sheet.id,
                'student_name': sheet.student_name,
                'question_paper': qp.title if qp else 'Unknown',
                'total_awarded': total_awarded,
                'total_max': total_max,
                'percentage': round(percentage, 2),
                'remarks': sheet.remarks,
                'evaluated_at': sheet.uploaded_at.isoformat()
            })
            
        return jsonify({'results': results}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@evaluation_bp.route('/results/export', methods=['GET'])
def export_results():
    """Export results as CSV"""
    try:
        import csv
        import io
        from flask import make_response
        
        evaluated_sheets = AnswerSheet.query.filter_by(status='evaluated').all()
        
        si = io.StringIO()
        cw = csv.writer(si)
        cw.writerow(['Student Name', 'Question Paper', 'Marks Obtained', 'Max Marks', 'Percentage', 'Remarks'])
        
        for sheet in evaluated_sheets:
            marks = Mark.query.filter_by(answer_sheet_id=sheet.id).all()
            total_awarded = sum(m.marks_awarded for m in marks)
            total_max = sum(m.max_marks for m in marks)
            percentage = (total_awarded / total_max * 100) if total_max > 0 else 0
            qp = QuestionPaper.query.get(sheet.question_paper_id) if sheet.question_paper_id else None
            
            cw.writerow([
                sheet.student_name,
                qp.title if qp else 'Unknown',
                total_awarded,
                total_max,
                f"{percentage:.2f}%",
                sheet.remarks or ''
            ])
            
        output = make_response(si.getvalue())
        output.headers["Content-Disposition"] = "attachment; filename=class_results.csv"
        output.headers["Content-type"] = "text/csv"
        return output
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@evaluation_bp.route('/zoom', methods=['POST'])
def zoom_region():
    """Crop and return a high-resolution zoomed version of a region"""
    try:
        data = request.json
        answer_sheet_id = data.get('answersheetId')
        page_number = data.get('page', 0)
        coordinates = data.get('coordinates')
        
        if not all([answer_sheet_id, coordinates]):
            return jsonify({'error': 'Missing required fields'}), 400
            
        answer_sheet = AnswerSheet.query.get_or_404(answer_sheet_id)
        
        # Extract region with high quality (zoom=4.0)
        zoom_image = PDFProcessor.extract_region(
            answer_sheet.file_path,
            page_number,
            coordinates
        )
        
        # Convert to base64
        img_buffer = io.BytesIO()
        zoom_image.save(img_buffer, format='PNG')
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        
        return jsonify({
            'image': f"data:image/png;base64,{img_base64}",
            'success': True
        }), 200
        
    except Exception as e:
        print(f"Error in zoom: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
