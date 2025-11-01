from flask import Blueprint, request, jsonify

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/test', methods=['GET'])
def test_auth():
    """Test authentication endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'Auth service is operational'
    }), 200