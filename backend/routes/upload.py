from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from models import db, QuestionPaper, AnswerSheet, EvaluationRubric
from config import Config
from services.pdf_processor import PDFProcessor
import os
from datetime import datetime

upload_bp = Blueprint('upload', __name__)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def get_upload_path(subject_id, folder_type, filename):
    """Generate subject-based upload path and ensure directory exists"""
    if subject_id and str(subject_id).lower() not in ['undefined', 'null', '', 'none']:
        base_dir = os.path.join(Config.UPLOAD_FOLDER, f"subject_{subject_id}", folder_type)
    else:
        base_dir = os.path.join(Config.UPLOAD_FOLDER, "misc", folder_type)
    
    os.makedirs(base_dir, exist_ok=True)
    return os.path.join(base_dir, filename)

def parse_id(id_val):
    """Safe parsing of ID from form data"""
    if id_val and str(id_val).lower() not in ['undefined', 'null', '', 'none']:
        try:
            return int(id_val)
        except (ValueError, TypeError):
            return None
    return None

@upload_bp.route('/question-paper', methods=['POST'])
def upload_question_paper():
    """Upload a question paper"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        title = request.form.get('title', '')
        total_questions = request.form.get('total_questions', 0)
        subject_id = request.form.get('subject_id')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Create database entry
        final_subject_id = parse_id(subject_id)
        
        # Create secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        # Save file with subject-based path
        filepath = get_upload_path(final_subject_id, 'question_papers', filename)
        file.save(filepath)
        
        # Generate thumbnail (non-critical)
        thumbnail_dir = os.path.join(Config.UPLOAD_FOLDER, 'thumbnails')
        os.makedirs(thumbnail_dir, exist_ok=True)
        thumbnail_path = os.path.join(thumbnail_dir, f"thumb_{filename}.png")
        try:
            PDFProcessor.generate_thumbnail(filepath, thumbnail_path)
        except Exception as e:
            print(f"Thumbnail generation skipped: {e}")
            
        question_paper = QuestionPaper(
            subject_id=final_subject_id,
            title=title or filename,
            file_path=filepath,
            total_questions=int(total_questions or 0)
        )
        db.session.add(question_paper)
        db.session.commit()
        
        return jsonify({
            'message': 'Question paper uploaded successfully',
            'data': question_paper.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/answer-sheet', methods=['POST'])
def upload_answer_sheet():
    """Upload an answer sheet"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        student_name = request.form.get('student_name', '')
        question_paper_id = request.form.get('question_paper_id')
        subject_id = request.form.get('subject_id')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Parse IDs
        final_qp_id = parse_id(question_paper_id)
        final_subject_id = parse_id(subject_id)

        # Create secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        # Save file with subject-based path
        filepath = get_upload_path(final_subject_id, 'answer_sheets', filename)
        file.save(filepath)
        print(f"✅ Saved answer sheet to {filepath}")
        
        # Generate thumbnail (non-critical)
        thumbnail_dir = os.path.join(Config.UPLOAD_FOLDER, 'thumbnails')
        os.makedirs(thumbnail_dir, exist_ok=True)
        thumbnail_path = os.path.join(thumbnail_dir, f"thumb_{filename}.png")
        try:
            PDFProcessor.generate_thumbnail(filepath, thumbnail_path)
        except Exception as e:
            print(f"⚠️ Answer sheet thumbnail generation skipped: {e}")
        
        answer_sheet = AnswerSheet(
            subject_id=final_subject_id,
            student_name=student_name or 'Unknown Student',
            file_path=filepath,
            question_paper_id=final_qp_id
        )
        db.session.add(answer_sheet)
        db.session.commit()
        
        return jsonify({
            'message': 'Answer sheet uploaded successfully',
            'data': answer_sheet.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Answer Sheet Upload Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/rubric', methods=['POST'])
def upload_rubric():
    """Upload an evaluation rubric"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        title = request.form.get('title', '')
        subject_id = request.form.get('subject_id')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Parse IDs
        final_subject_id = parse_id(subject_id)

        # Create secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{timestamp}_{filename}"
        
        # Save file with subject-based path
        filepath = get_upload_path(final_subject_id, 'rubrics', filename)
        file.save(filepath)
        print(f"✅ Saved rubric to {filepath}")
        
        # Generate thumbnail (non-critical)
        thumbnail_dir = os.path.join(Config.UPLOAD_FOLDER, 'thumbnails')
        os.makedirs(thumbnail_dir, exist_ok=True)
        thumbnail_path = os.path.join(thumbnail_dir, f"thumb_{filename}.png")
        try:
            PDFProcessor.generate_thumbnail(filepath, thumbnail_path)
        except Exception as e:
            print(f"⚠️ Rubric thumbnail generation skipped: {e}")
        
        rubric = EvaluationRubric(
            subject_id=final_subject_id,
            title=title or filename,
            file_path=filepath
        )
        db.session.add(rubric)
        db.session.commit()
        
        return jsonify({
            'message': 'Rubric uploaded successfully',
            'data': rubric.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/files', methods=['GET'])
def get_files():
    """Get list of files by type"""
    try:
        file_type = request.args.get('type', 'all')
        
        files = []
        
        if file_type in ['all', 'question']:
            question_papers = QuestionPaper.query.order_by(QuestionPaper.uploaded_at.desc()).all()
            files.extend([{**qp.to_dict(), 'type': 'question_paper'} for qp in question_papers])
        
        if file_type in ['all', 'answer']:
            answer_sheets = AnswerSheet.query.order_by(AnswerSheet.uploaded_at.desc()).all()
            files.extend([{**ans.to_dict(), 'type': 'answer_sheet'} for ans in answer_sheets])
        
        if file_type in ['all', 'rubric']:
            rubrics = EvaluationRubric.query.order_by(EvaluationRubric.uploaded_at.desc()).all()
            files.extend([{**rub.to_dict(), 'type': 'rubric'} for rub in rubrics])
        
        return jsonify({'files': files}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/files/<int:file_id>/view', methods=['GET'])
def view_file(file_id):
    """Serve a file for viewing"""
    try:
        file_type = request.args.get('type', 'answer')
        
        if file_type == 'question':
            file_obj = QuestionPaper.query.get_or_404(file_id)
        elif file_type == 'answer':
            file_obj = AnswerSheet.query.get_or_404(file_id)
        elif file_type == 'rubric':
            file_obj = EvaluationRubric.query.get_or_404(file_id)
        else:
            return jsonify({'error': 'Invalid file type'}), 400
        
        directory = os.path.dirname(file_obj.file_path)
        filename = os.path.basename(file_obj.file_path)
        
        return send_from_directory(directory, filename)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/files/<int:file_id>/thumbnail', methods=['GET'])
def get_thumbnail(file_id):
    """Get thumbnail for a file"""
    try:
        file_type = request.args.get('type', 'answer')
        
        if file_type == 'question':
            file_obj = QuestionPaper.query.get_or_404(file_id)
        elif file_type == 'answer':
            file_obj = AnswerSheet.query.get_or_404(file_id)
        elif file_type == 'rubric':
            file_obj = EvaluationRubric.query.get_or_404(file_id)
        else:
            return jsonify({'error': 'Invalid file type'}), 400
        
        filename = os.path.basename(file_obj.file_path)
        thumb_filename = f"thumb_{filename}.png"
        
        return send_from_directory(
            os.path.join(Config.UPLOAD_FOLDER, 'thumbnails'),
            thumb_filename
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 404
@upload_bp.route('/files/<int:file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete a file, its thumbnail, and its database record"""
    try:
        file_type = request.args.get('type', 'answer')
        
        if file_type == 'question':
            file_obj = QuestionPaper.query.get_or_404(file_id)
        elif file_type == 'answer':
            file_obj = AnswerSheet.query.get_or_404(file_id)
        elif file_type == 'rubric':
            file_obj = EvaluationRubric.query.get_or_404(file_id)
        else:
            return jsonify({'error': 'Invalid file type'}), 400
        
        # 1. Store paths before deleting record
        file_path = file_obj.file_path
        filename = os.path.basename(file_path)
        thumb_path = os.path.join(Config.UPLOAD_FOLDER, 'thumbnails', f"thumb_{filename}.png")
        
        # 2. Delete database record
        db.session.delete(file_obj)
        db.session.commit()
        
        # 3. Delete physical files (try-except as they might already be gone)
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
            if os.path.exists(thumb_path):
                os.remove(thumb_path)
        except Exception as e:
            print(f"Warning: Physical file deletion failed: {e}")
            
        return jsonify({'message': 'File deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@upload_bp.route('/answer-sheets-batch', methods=['POST'])
def upload_answer_sheets_batch():
    """Upload multiple answer sheets at once with auto student extraction"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        subject_id = request.form.get('subject_id')
        question_paper_id = request.form.get('question_paper_id')
        
        if not files or len(files) == 0:
            return jsonify({'error': 'No files selected'}), 400
        
        # Validate subject_id
        final_subject_id = None
        if subject_id and str(subject_id).lower() not in ['undefined', 'null', '']:
            try:
                final_subject_id = int(subject_id)
            except:
                pass
        
        # Validate question_paper_id
        final_qp_id = None
        if question_paper_id and str(question_paper_id).lower() not in ['undefined', 'null', '']:
            try:
                final_qp_id = int(question_paper_id)
            except:
                pass
        
        from services.student_extractor import StudentExtractor
        from services.pdf_processor import PDFProcessor
        
        extractor = StudentExtractor()
        results = []
        
        for file in files:
            if file.filename == '':
                continue
            
            if not allowed_file(file.filename):
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'message': 'Invalid file type'
                })
                continue
            
            try:
                # Create secure filename
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                filename = f"{timestamp}_{filename}"
                
                # Save file with subject-based path
                filepath = get_upload_path(final_subject_id, 'answer_sheets', filename)
                file.save(filepath)
                
                # Extract first page for student info
                try:
                    first_page_image = PDFProcessor.pdf_page_to_image(filepath, 0, zoom=2.0)
                    student_info = extractor.extract_student_info(first_page_image)
                except Exception as extract_err:
                    print(f"⚠️ Student extraction failed for {filename}: {extract_err}")
                    student_info = {'name': None, 'roll_number': None, 'class_name': None}
                
                # Use extracted name or fallback to filename
                student_name = student_info.get('name') or filename.split('.')[0]
                
                # Generate thumbnail (non-critical)
                thumbnail_dir = os.path.join(Config.UPLOAD_FOLDER, 'thumbnails')
                os.makedirs(thumbnail_dir, exist_ok=True)
                thumbnail_path = os.path.join(thumbnail_dir, f"thumb_{filename}.png")
                try:
                    PDFProcessor.generate_thumbnail(filepath, thumbnail_path)
                except Exception as e:
                    print(f"⚠️ Thumbnail generation skipped for {filename}: {e}")
                
                # Create database entry
                answer_sheet = AnswerSheet(
                    subject_id=final_subject_id,
                    student_name=student_name,
                    roll_number=student_info.get('roll_number'),
                    class_name=student_info.get('class_name'),
                    file_path=filepath,
                    question_paper_id=final_qp_id
                )
                db.session.add(answer_sheet)
                db.session.commit()
                
                results.append({
                    'filename': file.filename,
                    'status': 'success',
                    'student_name': student_name,
                    'roll_number': student_info.get('roll_number'),
                    'id': answer_sheet.id
                })
                
                print(f"✅ Uploaded {file.filename} → {student_name} ({student_info.get('roll_number')})")
                
            except Exception as e:
                db.session.rollback()
                results.append({
                    'filename': file.filename,
                    'status': 'error',
                    'message': str(e)
                })
                print(f"❌ Failed to upload {file.filename}: {str(e)}")
        
        # Summary
        successful = len([r for r in results if r['status'] == 'success'])
        failed = len([r for r in results if r['status'] == 'error'])
        
        return jsonify({
            'message': f'Uploaded {successful} answer sheets successfully, {failed} failed',
            'results': results,
            'summary': {
                'total': len(results),
                'successful': successful,
                'failed': failed
            }
        }), 201 if successful > 0 else 400
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Batch upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500
