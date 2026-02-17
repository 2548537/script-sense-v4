from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Subject(db.Model):
    """Subject/Class model for organizing evaluations"""
    __tablename__ = 'subjects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)  # e.g., "Physics 101"
    class_name = db.Column(db.String(100), nullable=True)  # e.g., "Class 12A"
    academic_year = db.Column(db.String(20), nullable=True)  # e.g., "2025-2026"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    question_papers = db.relationship('QuestionPaper', backref='subject', lazy=True, cascade='all, delete-orphan')
    answer_sheets = db.relationship('AnswerSheet', backref='subject', lazy=True, cascade='all, delete-orphan')
    rubrics = db.relationship('EvaluationRubric', backref='subject', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'class_name': self.class_name,
            'academic_year': self.academic_year,
            'created_at': self.created_at.isoformat(),
            'total_students': len(self.answer_sheets),
            'total_questions': sum(qp.total_questions for qp in self.question_papers) if self.question_papers else 0
        }

class QuestionPaper(db.Model):
    """Question paper model"""
    __tablename__ = 'question_papers'
    
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=True)  # Nullable for backward compatibility
    title = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    total_questions = db.Column(db.Integer, default=0)
    
    # Relationships
    marks = db.relationship('Mark', backref='question_paper', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'title': self.title,
            'file_path': self.file_path,
            'uploaded_at': self.uploaded_at.isoformat(),
            'total_questions': self.total_questions
        }


class AnswerSheet(db.Model):
    """Answer sheet model"""
    __tablename__ = 'answer_sheets'
    
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=True)  # Nullable for backward compatibility
    student_name = db.Column(db.String(200), nullable=False)
    roll_number = db.Column(db.String(50), nullable=True)  # Auto-extracted from answer sheet
    class_name = db.Column(db.String(100), nullable=True)  # Auto-extracted from answer sheet
    file_path = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    question_paper_id = db.Column(db.Integer, db.ForeignKey('question_papers.id'), nullable=True)
    remarks = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(50), default='pending')  # pending, evaluated
    
    # Relationships
    marks = db.relationship('Mark', backref='answer_sheet', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_name': self.student_name,
            'roll_number': self.roll_number,
            'class_name': self.class_name,
            'file_path': self.file_path,
            'uploaded_at': self.uploaded_at.isoformat(),
            'question_paper_id': self.question_paper_id,
            'subject_id': self.subject_id,
            'remarks': self.remarks,
            'status': self.status
        }


class EvaluationRubric(db.Model):
    """Evaluation rubric model"""
    __tablename__ = 'evaluation_rubrics'
    
    id = db.Column(db.Integer, primary_key=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=True)  # Nullable for backward compatibility
    title = db.Column(db.String(200), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    rubric_data = db.Column(db.Text, nullable=True)  # JSON string for structured data
    
    def to_dict(self):
        return {
            'id': self.id,
            'subject_id': self.subject_id,
            'title': self.title,
            'file_path': self.file_path,
            'uploaded_at': self.uploaded_at.isoformat(),
            'rubric_data': self.rubric_data
        }


class Mark(db.Model):
    """Mark model for storing question-wise marks"""
    __tablename__ = 'marks'
    
    id = db.Column(db.Integer, primary_key=True)
    answer_sheet_id = db.Column(db.Integer, db.ForeignKey('answer_sheets.id'), nullable=False)
    question_paper_id = db.Column(db.Integer, db.ForeignKey('question_papers.id'), nullable=True)
    question_number = db.Column(db.Integer, nullable=False)
    marks_awarded = db.Column(db.Float, nullable=False)
    max_marks = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate marks for same question
    __table_args__ = (
        db.UniqueConstraint('answer_sheet_id', 'question_number', name='unique_answer_question'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'answer_sheet_id': self.answer_sheet_id,
            'question_paper_id': self.question_paper_id,
            'question_number': self.question_number,
            'marks_awarded': self.marks_awarded,
            'max_marks': self.max_marks,
            'created_at': self.created_at.isoformat()
        }


class QuestionContent(db.Model):
    """Stores extracted question text from question papers"""
    __tablename__ = 'question_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    question_paper_id = db.Column(db.Integer, db.ForeignKey('question_papers.id'), nullable=False)
    question_number = db.Column(db.String(50), nullable=False)  # e.g., "Q1", "2a", "3.1"
    question_text = db.Column(db.Text, nullable=False)
    page_number = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('question_paper_id', 'question_number', name='unique_qp_question'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'question_paper_id': self.question_paper_id,
            'question_number': self.question_number,
            'question_text': self.question_text,
            'page_number': self.page_number,
            'created_at': self.created_at.isoformat()
        }


class RubricContent(db.Model):
    """Stores extracted grading criteria from rubrics"""
    __tablename__ = 'rubric_contents'
    
    id = db.Column(db.Integer, primary_key=True)
    rubric_id = db.Column(db.Integer, db.ForeignKey('evaluation_rubrics.id'), nullable=False)
    question_number = db.Column(db.String(50), nullable=False)  # e.g., "Q1", "2a"
    criteria_text = db.Column(db.Text, nullable=False)
    max_marks = db.Column(db.Float, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint
    __table_args__ = (
        db.UniqueConstraint('rubric_id', 'question_number', name='unique_rubric_question'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'rubric_id': self.rubric_id,
            'question_number': self.question_number,
            'criteria_text': self.criteria_text,
            'max_marks': self.max_marks,
            'created_at': self.created_at.isoformat()
        }

