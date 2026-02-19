import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///evaluation.db')
    if SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Secret key for JWT signing
    SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'scriptsense-dev-secret-key-change-in-production')
    
    # File Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 52428800))  # 50MB default
    ALLOWED_EXTENSIONS = {'pdf'}
    
    # Gemini API
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # CORS
    CORS_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    @staticmethod
    def init_app(app):
        """Initialize application configuration"""
        # Set Flask-specific limits
        app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE
        
        # Create upload directories
        os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'question_papers'), exist_ok=True)
        os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'answer_sheets'), exist_ok=True)
        os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'rubrics'), exist_ok=True)
        os.makedirs(os.path.join(Config.UPLOAD_FOLDER, 'thumbnails'), exist_ok=True)
