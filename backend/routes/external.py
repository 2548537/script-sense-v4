"""
routes/external.py
──────────────────
External Evaluator (Second Evaluator) API routes.

All endpoints accept ?user_id=<id> as a query param for auth (no JWT needed).
"""

from flask import Blueprint, request, jsonify
from models import db, User, Subject, AnswerSheet

external_bp = Blueprint('external', __name__)


def _strip_teacher_marks(sheet_dict: dict) -> dict:
    """Remove teacher_marks from a script dict to enforce blind evaluation."""
    sheet_dict.pop('teacher_marks', None)
    return sheet_dict


@external_bp.route('/subjects', methods=['GET'])
def get_external_subjects():
    """Return subjects where the current user is the second evaluator."""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 401
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401

        subjects = Subject.query.filter_by(second_evaluator_id=user.id).order_by(Subject.created_at.desc()).all()

        result = []
        for s in subjects:
            ready_scripts = AnswerSheet.query.filter(
                AnswerSheet.subject_id == s.id,
                AnswerSheet.status.in_(['FIRST_DONE', 'SECOND_DONE'])
            ).all()

            already_done = [a for a in ready_scripts if a.status == 'SECOND_DONE']

            d = s.to_dict()
            d.pop('first_evaluator_id', None)
            d.pop('first_evaluator_name', None)
            d['stats'] = {
                'ready_for_evaluation': len([a for a in ready_scripts if a.status == 'FIRST_DONE']),
                'completed': len(already_done),
                'total_ready': len(ready_scripts)
            }
            result.append(d)

        return jsonify({'subjects': result}), 200

    except Exception as e:
        print(f"❌ External subjects error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@external_bp.route('/subjects/<int:subject_id>/scripts', methods=['GET'])
def get_external_scripts(subject_id):
    """Return scripts ready for second evaluation (status FIRST_DONE or SECOND_DONE).
    CRITICAL: teacher_marks are stripped from all responses.
    """
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 401
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401

        subject = Subject.query.get_or_404(subject_id)

        if subject.second_evaluator_id != user.id:
            return jsonify({'error': 'You are not the second evaluator for this subject'}), 403

        sheets = AnswerSheet.query.filter(
            AnswerSheet.subject_id == subject_id,
            AnswerSheet.status.in_(['FIRST_DONE', 'SECOND_DONE'])
        ).order_by(AnswerSheet.roll_number).all()

        scripts = [_strip_teacher_marks(sheet.to_dict()) for sheet in sheets]

        subject_dict = subject.to_dict()
        subject_dict.pop('first_evaluator_id', None)
        subject_dict.pop('first_evaluator_name', None)

        return jsonify({
            'subject': subject_dict,
            'scripts': scripts,
            'total': len(scripts)
        }), 200

    except Exception as e:
        print(f"❌ External scripts error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@external_bp.route('/scripts/<int:script_id>/marks', methods=['POST'])
def submit_external_marks(script_id):
    """Submit external evaluator marks for a script.

    Body: { user_id: int, marks: float, remarks: str (optional) }
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 401
        user = db.session.get(User, int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 401

        sheet = AnswerSheet.query.get_or_404(script_id)

        subject = Subject.query.get(sheet.subject_id)
        if not subject or subject.second_evaluator_id != user.id:
            return jsonify({'error': 'You are not the second evaluator for this subject'}), 403

        if sheet.status not in ('FIRST_DONE', 'SECOND_DONE'):
            return jsonify({'error': 'First evaluation must be completed before second evaluation'}), 400

        marks = data.get('marks')
        remarks = data.get('remarks')

        if marks is None:
            return jsonify({'error': 'marks field is required'}), 400

        try:
            marks = float(marks)
        except (ValueError, TypeError):
            return jsonify({'error': 'marks must be a number'}), 400

        if marks < 0:
            return jsonify({'error': 'marks cannot be negative'}), 400

        sheet.external_marks = marks
        if remarks is not None:
            sheet.remarks = (sheet.remarks or '') + f'\n[External]: {remarks}'

        final = sheet.compute_final_marks()
        if final is not None:
            sheet.status = 'SECOND_DONE'
            print(f"✅ Final marks computed for script {script_id}: {final}")
        else:
            sheet.status = 'SECOND_DONE'

        db.session.commit()
        print(f"✅ External marks saved: script={script_id}, marks={marks}, final={sheet.final_marks}")

        return jsonify({
            'message': 'External marks submitted successfully',
            'script': {
                'id': sheet.id,
                'student_name': sheet.student_name,
                'external_marks': sheet.external_marks,
                'final_marks': sheet.final_marks,
                'status': sheet.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Submit external marks error: {str(e)}")
        return jsonify({'error': str(e)}), 500
