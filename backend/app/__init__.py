from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

load_dotenv()

def create_app():
    app = Flask(__name__)

    # Enable CORS for all origins under /api/
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://127.0.0.1:5500", "http://localhost:5500", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Register blueprints
    from app.routes.auth_routes import auth_bp
    from app.routes.resume_routes import resume_bp
    from app.routes.ai_routes import ai_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')

    # ----------------------------------------------------
    # ✅ FRONTEND DIRECTORY (Update path here)
    # ----------------------------------------------------
    FRONTEND_DIR = r"C:\Users\Usman Ali\Downloads\ai-resume-builder\frontend"

    @app.route('/')
    def serve_index():
        index_path = os.path.join(FRONTEND_DIR, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(FRONTEND_DIR, 'index.html')
        else:
            return jsonify({
                "error": "index.html not found",
                "expected_path": index_path
            }), 404

    # Serve other static files (CSS, JS, etc.)
    @app.route('/<path:path>')
    def serve_static_files(path):
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.exists(file_path):
            return send_from_directory(FRONTEND_DIR, path)
        else:
            return jsonify({'error': 'File not found', 'requested': path}), 404

    # Health check route
    @app.route('/api/health')
    def health():
        return {
            'status': 'healthy',
            'message': 'AI Resume Builder API is running',
            'version': '1.0.0'
        }

    print(f"📁 Serving frontend from: {FRONTEND_DIR}")
    return app
