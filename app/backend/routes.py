from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app, session
from etl.extract import extract_data, extract_product_data
from etl.transform import transform
from etl.load import write_db
from models import ProductTag
from db_handler import DatabaseService
import pandas as pd
from io import StringIO
from flask import jsonify
import hashlib
import uuid
from models import Transactions,Expense
from datetime import datetime

# Define the Blueprint for routes
main = Blueprint('main', __name__)
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

@main.route('/', methods=['GET', 'POST'])
def index():
    current_app.logger.info(f"Request JSON: {request.json}")
    if request.method == 'POST':
        username = request.json.get('username')
        if not username:
            return jsonify({'error': 'Username is required'}), 400
        
        # Generate a unique session ID
        session_id = generate_unique_session_id(username)        
        # Add session to database with username
        db_service.add_session(session_id, username)
        return jsonify({
            'success': True,
            'sessionId': session_id
        })

@main.route('/upload', methods=['GET', 'POST'])
def upload_file():
    try:
        if request.method == 'POST':
            if 'file' not in request.files:
                current_app.logger.info('No file uploaded')
                return jsonify({'error': 'No file part'}), 400

            sessionId = request.form.get('sessionId')
            session['current_session_id'] = sessionId

            if not sessionId :
                return jsonify({'error': 'No active session. Please provide username first'}), 401

            file = request.files['file']

            if file.filename == '':
                current_app.logger.info('No selected file')
                return jsonify({'error': 'No selected file'}), 400

            if not allowed_file(file.filename):
                current_app.logger.info('File not in CSV format')
                return jsonify({'error': 'File is not in CSV format'}), 400

            file.seek(0, 2)
            file_length = file.tell()
            if file_length > 25 * 1024 * 1024:
                return jsonify({'error': 'File size exceeds the maximum limit of 25 MB'}), 400
            file.seek(0)
            try:
                file_content = file.read().decode('utf-8')
                input_data = extract_data(file_content)
                processed_data = transform(input_data)
                write_db(processed_data, sessionId)
                current_app.logger.info('File successfully processed and saved to the database')
                return jsonify({'message': 'File uploaded successfully'}), 200
            except Exception as e:
                current_app.logger.error(f'{e}')
                return jsonify({'error': 'Error processing file'}), 500
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@main.route('/upload_tags', methods=['GET', 'POST'])
def upload_tags():
    sessionId = request.form.get('sessionId')
    try:
        if request.method == 'POST':
            if 'pdtFile' not in request.files:
                current_app.logger.info('No file uploaded')
                return jsonify({'error': 'No File Uploaded'}), 400

            file = request.files['pdtFile']

            if not allowed_file(file.filename):
                current_app.logger.info('File not in CSV format')
                return jsonify({'error': 'File not in CSV form'}), 400

            file.seek(0, 2)
            file_length = file.tell()
            if file_length > 10 * 1024 * 1024:
                return jsonify({'error': 'Exceeds size limit of 10MB'}), 400
            file.seek(0)

            try:
                file_content = file.read().decode('utf-8')
                extract_product_data(file_content, sessionId)
                current_app.logger.info('File successfully processed and saved to the product_tags database')
                return jsonify({'message': 'File uploaded successfully'}), 200
            except Exception as e:
                current_app.logger.error(f'{e}')
                return jsonify({'error': 'Internal Error Processing File'}), 400
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        return jsonify({'error': 'Internal Error Processing File'}), 400

@main.route('/expenses')
def view_expenses():
    session_id = session.get('current_session_id')
    if not session_id:
        flash("No active session. Please provide username first", "error")
        return redirect(url_for('main.index'))
    return render_template('grafana.html', session_id=session_id)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}

@main.route('/edit', methods=['GET'])
def get_transactions():
    try:
        session_id = request.args.get('sessionId')  # Assuming it's passed as a query parameter
        if not session_id:
            return jsonify({'error': 'Session ID is required'}), 400
    
        # Filter transactions by session ID
        transactions = Expense.query.filter_by(session_id=session_id).all()
        return jsonify([{
            'id': t.id,
            'date': t.transaction_date,
            'narration': t.narration,
            'product': t.product,
            'amount': float(t.debit_amount),
            'tag': t.tag,
            'mode': t.mode
        } for t in transactions])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@main.route('/update-tag', methods=['POST'])
def update_transaction_tag():
    try:
        data = request.json
        session_id = data.get('sessionId')
        product = data.get('product')
        new_tag = data.get('newTag')

        existing_entry = ProductTag.query.filter_by(session_id=session_id, product=product).first()
        if existing_entry:
            existing_entry.tag = new_tag
            db_service.commit_changes()
        else:
            new_entry = ProductTag(session_id=session_id, product=product, tag=new_tag)
            db_service._commit(new_entry)
        return jsonify({'message': 'Tag updated successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        return jsonify({'error': str(e)}), 500