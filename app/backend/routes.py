from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app, session,jsonify
from etl.extract import extract_data, extract_product_data
from etl.transform import transform, ai_trigger
from etl.load import write_db
from models import ProductTag
from db_handler import DatabaseService
from models import Expense,Session
from utils import *
import os 

# Define the Blueprint for routes
main = Blueprint('main', __name__)
db_service = DatabaseService()


@main.route('/check_username', methods=['GET', 'POST'])
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
        processed_data = transform(input_data, sessionId)
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
            file = request.files['file']  # Read file from form-data
            if not file:
                current_app.logger.info(f"Request files: {request.files.keys()}")  # Debugging
                return jsonify({'error': 'No File Uploaded'}), 400
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
    

@main.route('/populate-expenses', methods=['POST'])
def populate_expense_data():
    """
    API to populate the expense_data table from transactions and product_tags.
    """
    session_id = request.json.get('sessionId')
    current_app.logger.info(f"Populating Expense Data for {session_id}")
    if not session_id:
        return jsonify({'error': 'Session ID is required'}), 400

    try:
        query = """
            INSERT INTO expense_data (session_id, transaction_date, narration, debit_amount, product, mode, tag)
            SELECT 
                t.session_id,
                t.transaction_date,
                t.narration,
                t.debit_amount,
                t.product,
                t.mode,
                pt.tag
            FROM transactions t
            LEFT JOIN product_tags pt 
                ON t.product = pt.product AND t.session_id = pt.session_id
            WHERE NOT EXISTS (
                SELECT 1 FROM expense_data e
                WHERE e.session_id = t.session_id 
                AND e.transaction_date = t.transaction_date 
                AND e.narration = t.narration
            );
        """

        db_service.execute_query(query)
        enable_ai = current_app.config.get('ENABLE_AI', False)
        ai_trigger(session_id, enable_ai)
        return jsonify({'message': 'Expense data populated successfully', "status": "completed"}), 200

    except Exception as e:
        current_app.logger.error(f"Error populating expense data: {e}")
        return jsonify({'error': 'Failed to populate expense data'}), 500

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
        
        expenses_to_update = Expense.query.filter_by(session_id=session_id, product=product).all()
        for expense in expenses_to_update:
            expense.tag = new_tag
            db_service.commit_changes()

        return jsonify({'message': 'Tag updated successfully'}), 200
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        return jsonify({'error': str(e)}), 500
    
@main.route('/ai-trigger', methods=['POST'])
def trigger_ai():
    data = request.json
    sessionId = data.get("sessionId")
    enable_ai = data.get("enableAI", False)
    current_app.config['ENABLE_AI'] = enable_ai
    print("CONFIG FOR ENABLE AI SET TO " + str(enable_ai))
    return jsonify({"message": "AI Trigger processed"}), 200

@main.route('/update-product', methods=['POST'])
def update_product():
    data = request.get_json()
    id = data['transactionId']
    session_id = data['sessionId']
    old_product = data['oldProduct']  
    new_product = data['newProduct']
    replace_all = data['replaceAll']
    tag = data['tag']

    try:
        if replace_all:
            # Update all records where the product is old_product to new_product
            product_tags_to_update = ProductTag.query.filter_by(session_id=session_id, product=old_product).all()
            for product_tag in product_tags_to_update:
                product_tag.product = new_product
            current_app.logger.info(f"Updating all product names from {old_product} to  {new_product}")

            expenses_to_update = Expense.query.filter_by(session_id=session_id, product=old_product).all()
            for expense in expenses_to_update:
                expense.product = new_product
            db_service.commit_changes()
        else:
            # Add a new record with the new product name and tag
            new_product_tag = ProductTag(session_id=session_id, product=new_product, tag=tag)
            expense = Expense.query.filter_by(id=id).first()  # Fetch a single record
            current_app.logger.info(f"Updating main expense table")
            if expense:
                expense.product = new_product  # Update the product field
                db_service.commit_changes()
            current_app.logger.info(f"Creating a new product mapping with {new_product} - {tag}")
            db_service._commit(new_product_tag)
        return jsonify({'message': 'Product updated successfully'}), 200
    except Exception as e:
        current_app.logger.info(e)
        return jsonify({'error': str(e)}), 500



