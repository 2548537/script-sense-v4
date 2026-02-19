"""
routes/teacher.py
─────────────────
Teacher (First Evaluator) API routes.

A teacher sees only subjects where they are assigned as first_evaluator.
They can view all scripts for those subjects and submit teacher_marks.
After submission, the script status becomes FIRST_DONE.

Endpoints:
    GET  /api/teacher/subjects                   – Assigned subjects
    GET  /api/teacher/subjects/<id>/scripts      – Scripts for a subject
    POST /api/teacher/scripts/<id>/marks         – Submit teacher marks

All endpoints accept ?user_id=<id> as a query param for auth.
"""

from flask import Blueprint, request, jsonify
from models import db, User, Subject, AnswerSheet

teacher_bp = Blueprint('teacher', __name__)


def get_user_from_param():
    """Get and validate user from user_id query param."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        # Also check JSON body for POST requests
        try:
            data = request.get_json(silent=True) or {}
            user_id = data.get('user_id')
        except Exception:
            pass
    if not user_id:
        return None, jsonify({'error': 'user_id is required'}), 401
    user = db.session.get(User, int(user_id))
    if not user:
        return None, jsonify({'error': 'User not found'}), 401
    return user, None, None


@teacher_bp.route('/subjects', methods=['GET'])
def get_teacher_subjects():
    """Return subjects where the current user is the first evaluator (teacher)."""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 401
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401

        subjects = Subject.query.filter_by(first_evaluator_id=user.id).order_by(Subject.created_at.desc()).all()

        result = []
        for s in subjects:
            all_sheets = AnswerSheet.query.filter_by(subject_id=s.id).all()
            first_done = [a for a in all_sheets if a.status in ('FIRST_DONE', 'SECOND_DONE', 'evaluated')]
            pending = [a for a in all_sheets if a.status in ('UPLOADED', 'pending')]

            d = s.to_dict()
            d['stats'] = {
                'total': len(all_sheets),
                'evaluated_by_me': len(first_done),
                'pending': len(pending)
            }
            result.append(d)

        return jsonify({'subjects': result}), 200

    except Exception as e:
        print(f"❌ Teacher subjects error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/subjects/<int:subject_id>/scripts', methods=['GET'])
def get_teacher_scripts(subject_id):
    """Return all answer sheets for a subject assigned to the current teacher."""
    try:
        user_id = request.args.get('user_id', type=int)
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 401
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 401

        subject = Subject.query.get_or_404(subject_id)

        if subject.first_evaluator_id != user.id:
            return jsonify({'error': 'You are not the first evaluator for this subject'}), 403

        sheets = AnswerSheet.query.filter_by(subject_id=subject_id).order_by(AnswerSheet.roll_number).all()

        scripts = []
        for sheet in sheets:
            d = sheet.to_dict()
            d.pop('external_marks', None)  # Teachers must not see external marks
            scripts.append(d)

        return jsonify({
            'subject': subject.to_dict(),
            'scripts': scripts,
            'total': len(scripts)
        }), 200

    except Exception as e:
        print(f"❌ Teacher scripts error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@teacher_bp.route('/scripts/<int:script_id>/marks', methods=['POST'])
def submit_teacher_marks(script_id):
    """Submit teacher (first evaluator) marks for a script.

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
        if not subject or subject.first_evaluator_id != user.id:
            return jsonify({'error': 'You are not the first evaluator for this subject'}), 403

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

        sheet.teacher_marks = marks
        sheet.status = 'FIRST_DONE'
        if remarks is not None:
            sheet.remarks = remarks

        final = sheet.compute_final_marks()
        if final is not None:
            sheet.status = 'SECOND_DONE'
            print(f"✅ Final marks computed for script {script_id}: {final}")

        db.session.commit()
        print(f"✅ Teacher marks saved: script={script_id}, marks={marks}, status={sheet.status}")

        return jsonify({
            'message': 'Teacher marks submitted successfully',
            'script': {
                'id': sheet.id,
                'student_name': sheet.student_name,
                'teacher_marks': sheet.teacher_marks,
                'final_marks': sheet.final_marks,
                'status': sheet.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Submit teacher marks error: {str(e)}")
        return jsonify({'error': str(e)}), 500
