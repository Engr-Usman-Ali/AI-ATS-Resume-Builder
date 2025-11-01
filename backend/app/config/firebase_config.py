import firebase_admin
from firebase_admin import credentials, firestore, auth
import os

# Initialize Firebase Admin
cred_path = os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json')

try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin initialized successfully")
except Exception as e:
    print(f"❌ Firebase initialization error: {e}")

# Get Firestore client
db = firestore.client()

def verify_token(id_token):
    """Verify Firebase ID token"""
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        print(f"Token verification error: {e}")
        return None