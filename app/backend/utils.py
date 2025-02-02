from flask import request, current_app
from db_handler import DatabaseService
from datetime import datetime
import hashlib
import uuid

db_service = DatabaseService()

def generate_unique_session_id(username: str) -> str:
    """
    Generate a unique session ID based on username and timestamp.
    Uses a combination of techniques to ensure uniqueness:
    1. Username hash
    2. Timestamp
    3. Random UUID
    4. Retry mechanism if collision occurs
    """
    base = hashlib.sha256(
        f"{username}:{datetime.utcnow().isoformat()}:{uuid.uuid4()}".encode()
    ).hexdigest()
    
    # Take first 32 characters as the session ID
    session_id = base[:32]
    
    # Check if this session ID already exists
    while db_service.session_exists(session_id):
        # If collision, generate a new one with a different UUID
        session_id = hashlib.sha256(
            f"{username}:{datetime.utcnow().isoformat()}:{uuid.uuid4()}".encode()
        ).hexdigest()[:32]
    
    return session_id


def validate_file(file):
    if 'file' not in request.files:
        current_app.logger.info('No file uploaded')
        return 'No file part', 400

    if file.filename == '':
        current_app.logger.info('No selected file')
        return 'No selected file', 400

    if not allowed_file(file.filename):
        current_app.logger.info('File not in CSV format')
        return 'File is not in CSV format', 400

    file.seek(0, 2)  # Move to end of file to check size
    file_length = file.tell()
    file.seek(0)  # Reset pointer
    if file_length > 25 * 1024 * 1024:
        return 'File size exceeds the maximum limit of 25 MB', 400
    
    return None  # No errors

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}
