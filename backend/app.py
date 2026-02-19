from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes.upload import upload_bp
from routes.evaluation import evaluation_bp
from datetime import datetime

def create_app():
    """Create and configure Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    Config.init_app(app)
    
    # JWT configuration
    app.config['JWT_SECRET_KEY'] = Config.SECRET_KEY
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire (simplicity for dev)
    
    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    
    # Global Error Handler for Logging
    @app.errorhandler(Exception)
    def handle_exception(e):
        import traceback
        import time
        timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
        error_msg = f"[{timestamp}] ERROR: {str(e)}\n{traceback.format_exc()}\n"
        print(error_msg)
        with open('error_log.txt', 'a', encoding='utf-8') as f:
            f.write(error_msg + "-"*50 + "\n")
        return jsonify(error=str(e)), 500

    # Standard robust CORS for production
    CORS(app, supports_credentials=True, resources={
        r"/api/*": {
            "origins": "*",
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "OPTIONS", "PUT", "DELETE"]
        }
    })
    
    @app.route('/api/test-connection', methods=['GET', 'POST', 'OPTIONS'])
    def test_connection():
        """Fast endpoint to verify CORS and connectivity without file overhead"""
        response = jsonify({
            'status': 'connected',
            'message': 'Backend is reachable and CORS is working!',
            'timestamp': datetime.utcnow().isoformat(),
            'server_identity': 'scriptsense-v3-backend'
        })
        # Add custom identity header for frontend verification
        response.headers['X-ScriptSense-Server'] = 'scriptsense-v3-backend'
        return response, 200

    @app.route('/api/preflight', methods=['OPTIONS'])
    def preflight():
        """Explicit preflight handler for testing"""
        return '', 204
    
    # ── Existing blueprints (unchanged) ──────────────────────────────────
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(evaluation_bp, url_prefix='/api/evaluate')
    
    from routes.subject import subject_bp
    app.register_blueprint(subject_bp, url_prefix='/api/subjects')

    # ── NEW: Role-based evaluation workflow blueprints ────────────────────
    from routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    from routes.teacher import teacher_bp
    app.register_blueprint(teacher_bp, url_prefix='/api/teacher')

    from routes.external import external_bp
    app.register_blueprint(external_bp, url_prefix='/api/external')
    
    # Create database tables (new tables/columns added automatically)
    with app.app_context():
        db.create_all()
    
    @app.route('/')
    def index():
        return {'message': 'Answer Sheet Evaluation API', 'status': 'running'}
    
    @app.route('/health')
    def health():
        return {'status': 'healthy'}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)

