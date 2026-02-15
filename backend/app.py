from flask import Flask
from flask_cors import CORS
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
    
    # Initialize extensions
    db.init_app(app)
    # Aggressive CORS for production diagnostics
    CORS(app, resources={r"/api/*": {"origins": "*", "allow_headers": "*", "methods": "*"}})
    
    # Register blueprints
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(evaluation_bp, url_prefix='/api/evaluate')

    @app.route('/api/test-connection', methods=['GET', 'POST', 'OPTIONS'])
    def test_connection():
        """Fast endpoint to verify CORS and connectivity without file overhead"""
        return jsonify({
            'status': 'connected',
            'message': 'Backend is reachable and CORS is working!',
            'timestamp': datetime.utcnow().isoformat()
        }), 200

    @app.after_request
    def after_request(response):
        """Manually inject CORS headers for extra robustness"""
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        
        # Explicitly handle preflight
        if request.method == 'OPTIONS':
            return response
            
        return response
    
    # Create database tables
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
