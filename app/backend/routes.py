from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app, session,jsonify
from etl.extract import extract_data, extract_product_data
from etl.transform import transform
from etl.load import write_db
from models import ProductTag
from db_handler import DatabaseService
from models import Expense,Session
from utils import *
import os 

# Define the Blueprint for routes
main = Blueprint('main', __name__)
db_service = DatabaseService()


@main.route('/check_username', methods=['POST'])
def check_username():
    data = request.json
    username = data.get("username")

    if not username:
        return jsonify({"error": "Username is required"}), 400

    existing_session = Session.query.filter_by(username=username).first()
    return jsonify({"exists": existing_session is not None})
    
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
    sessionId=""
    try:
        sample_file = request.args.get("sample_file", "false").lower() == "true"
        sessionId=request.args.get('sessionId') 
        if sample_file:
            sample_file_path = os.path.join(current_app.config.get('UPLOADS_FOLDER'), "sample_data.csv")
            if not os.path.exists(sample_file_path):
                return jsonify({'error': 'Sample file not found'}), 404
            with open(sample_file_path, "r", encoding="utf-8") as file:
                file_content = file.read()
        else:
            sessionId = request.form.get('sessionId')
            file = request.files['file']
            error = validate_file(file)
            if error:
                return jsonify({'error': error[0]}), error[1]
            file_content = file.read().decode('utf-8')

        input_data = extract_data(file_content)
        processed_data = transform(input_data)
        write_db(processed_data, sessionId)
        current_app.logger.info('File successfully processed and saved to the database')
        return jsonify({'message': 'File uploaded successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@main.route('/upload_tags', methods=['GET', 'POST'])
def upload_tags():
    try:
        sample_file = request.args.get("sample_file", "false").lower() == "true"
        sessionId=request.args.get('sessionId') 
        if sample_file:
            sample_file_path = os.path.join(current_app.config.get('UPLOADS_FOLDER'), "sample_tags.csv")
            if not os.path.exists(sample_file_path):
                return jsonify({'error': 'Sample file not found'}), 404
            with open(sample_file_path, "r") as file:
                file_content = file.read()
        else:
            sessionId = request.form.get('sessionId')
            if 'pdtFile' not in request.files:
                current_app.logger.info('No file uploaded')
                return jsonify({'error': 'No File Uploaded'}), 400
            file = request.files['pdtFile']
            error = validate_file(file)
            if error:
                return jsonify({'error': error[0]}), error[1]
            file_content = file.read().decode('utf-8')
        extract_product_data(file_content, sessionId)
        current_app.logger.info('File successfully processed and saved to the product_tags database')
        return jsonify({'message': 'File uploaded successfully'}), 200
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