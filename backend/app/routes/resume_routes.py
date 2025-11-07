from flask import Blueprint, request, jsonify
from app.config.firebase_config import db, verify_token
from datetime import datetime

resume_bp = Blueprint('resume', __name__)

def get_user_from_token():
    """Extract user from Authorization header"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split('Bearer ')[1]
    return verify_token(token)

@resume_bp.route('/save', methods=['POST'])
def save_resume():
    """Save or update resume"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        resume_data = request.json
        user_id = user['uid']
        
        # Add metadata
        resume_data['userId'] = user_id
        resume_data['updatedAt'] = datetime.now().isoformat()
        
        if 'createdAt' not in resume_data:
            resume_data['createdAt'] = datetime.now().isoformat()
        
        # Save to Firestore
        resume_id = resume_data.get('id')
        if resume_id:
            # Update existing
            db.collection('resumes').document(resume_id).set(resume_data)
        else:
            # Create new
            doc_ref = db.collection('resumes').add(resume_data)
            resume_id = doc_ref[1].id
            resume_data['id'] = resume_id
        
        return jsonify({
            'success': True,
            'message': 'Resume saved successfully',
            'resumeId': resume_id
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/list', methods=['GET'])
def list_resumes():
    """Get all resumes for user"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        user_id = user['uid']
        
        # Query resumes
        resumes_ref = db.collection('resumes').where('userId', '==', user_id)
        resumes = []
        
        for doc in resumes_ref.stream():
            resume = doc.to_dict()
            resume['id'] = doc.id
            resumes.append(resume)
        
        return jsonify({
            'success': True,
            'resumes': resumes
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<resume_id>', methods=['GET'])
def get_resume(resume_id):
    """Get specific resume"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        doc = db.collection('resumes').document(resume_id).get()
        
        if not doc.exists:
            return jsonify({'error': 'Resume not found'}), 404
        
        resume = doc.to_dict()
        resume['id'] = doc.id
        
        # Verify ownership
        if resume.get('userId') != user['uid']:
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify({
            'success': True,
            'resume': resume
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@resume_bp.route('/<resume_id>', methods=['DELETE'])
def delete_resume(resume_id):
    """Delete resume"""
    try:
        user = get_user_from_token()
        if not user:
            return jsonify({'error': 'Unauthorized'}), 401
        
        # Verify ownership
        doc = db.collection('resumes').document(resume_id).get()
        if doc.exists:
            resume = doc.to_dict()
            if resume.get('userId') != user['uid']:
                return jsonify({'error': 'Unauthorized'}), 403
        
        db.collection('resumes').document(resume_id).delete()
        
        return jsonify({
            'success': True,
            'message': 'Resume deleted successfully'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500