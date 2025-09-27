from flask import Blueprint, Flask, request, jsonify,  current_app
from db.db_handler import DatabaseService
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
from services.file_loader import FileLoader
from utils.response_helper import success_response, error_response
import numpy as np
from services.visualization_service import visualization_service
import pandas as pd
from db.models import Transactions, ProductTag
from services.pdf_processor import PDFProcessor
from services.excel_processor import ExcelProcessor
from config import Config
import boto3
from io import BytesIO

main = Blueprint('main', __name__)
db_service = DatabaseService()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB

# Configuration
ALLOWED_EXTENSIONS = {'pdf', 'csv', 'xlsx', 'xls'}

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name="eu-north-1",
    endpoint_url="https://s3.eu-north-1.amazonaws.com" 
)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_file_type(filename):
    extension = filename.rsplit('.', 1)[1].lower()
    if extension == 'pdf':
        return 'pdf'
    elif extension == 'csv':
        return 'csv'
    elif extension in ['xlsx', 'xls']:
        return 'excel'
    else:
        return 'unsupported'
    
pdf_processor = PDFProcessor()
excel_processor = ExcelProcessor()

def check_password_protection(file_obj, file_type):
    current_app.logger.info("Checking if the file is password protected")
    try:
        if file_type == 'pdf':
            return pdf_processor.is_password_protected(file_obj)
        elif file_type == 'excel':
            return excel_processor.is_password_protected(file_obj)
        else:
            return False
    except Exception as e:
        current_app.logger.error(f"Password check error for {file_type}: {e}")
        return False
    
@main.route('/health', methods=['GET'])
def health_check():
    return success_response({'status': 'healthy', 'message': 'Backend is running'})


@main.route('/analyze', methods=['POST'])
def analyze_files():
    try:
        data = request.get_json()
        if not data or 'files' not in data:
            return error_response('No files data provided', 400)
        
        files_data = data['files']
        session_id = data['session_id']
        db_service.save_session_if_not_exists(session_id)

        results = []

        for file_info in files_data:
            s3_key = file_info.get('file_path')  # now file_path is the S3 key
            classification = file_info.get('classification', 'Unknown')
            filename = file_info.get('filename')
            password = file_info.get('password')

            if not s3_key:
                results.append({
                    'filename': filename,
                    'status': 'error',
                    'message': 'S3 key not provided'
                })
                continue

            try:
                # Download file from S3 into memory
                file_obj = BytesIO()
                s3_client.download_fileobj(BUCKET_NAME, s3_key, file_obj)
                file_obj.seek(0)  # reset pointer to start

                # Process based on file type
                file_loader = FileLoader()
                df = file_loader.load(file_obj, password, filename)
                df['Source'] = classification

                # Convert DataFrame to dict for JSON response
                df.replace({np.nan: None, np.inf: None, -np.inf: None}, inplace=True)
                transactions = df.to_dict('records')
                current_app.logger.info(f"Transactions processed successfully")

                results.append({
                    'filename': filename,
                    'status': 'success',
                    'classification': classification,
                    'transaction_count': len(transactions),
                    'transactions': transactions,
                    'total_transactions': len(transactions)
                })

            except Exception as file_error:
                error_message = str(file_error)
                if 'password' in error_message.lower() or 'encrypted' in error_message.lower():
                    results.append({
                        'filename': filename,
                        'status': 'error',
                        'message': 'Invalid password or password required',
                        'password_required': True
                    })
                else:
                    results.append({
                        'filename': filename,
                        'status': 'error',
                        'message': error_message
                    })

        return success_response({
            'message': 'Analysis completed',
            'results': results
        })

    except Exception as e:
        current_app.logger.error(f'Analysis failed: {str(e)}')
        return error_response(f'Analysis failed: {str(e)}', 500)

@main.route('/download/<filename>', methods=['GET'])
def download_results(filename):
    try:
        return success_response({'message': 'Download endpoint ready'})
    except Exception as e:
        return error_response(f'Download failed: {str(e)}', 500)

@main.route('/sample-mappings', methods=['GET'])
def get_sample_mappings():
    """Get sample product-category mappings from CSV file"""
    try:
        sample_file_path = os.path.join(Config.STATIC_FOLDER, 'sample_data', 'product_mappings.csv')
        if not os.path.exists(sample_file_path):
            return error_response('Sample mappings file not found', 404)
        
        # Read CSV file
        df = pd.read_csv(sample_file_path)
        mappings = df.to_dict('records')
        
        return success_response({
            'mappings': mappings,
            'total_count': len(mappings)
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to load sample mappings : {str(e)}')
        return error_response(f'Failed to load sample mappings: {str(e)}', 500)
    
@main.route('/save-product-mappings', methods=['POST'])
def save_product_mappings():
    """Save product-tag mappings to database table"""
    try:
        data = request.get_json()
        
        if not data or 'mappings' not in data or 'session_id' not in data:
            return error_response('Mappings data and session_id are required', 400)
        
        mappings = data['mappings']
        session_id = data['session_id']
        
        # Save mappings using visualization service
        result = db_service.save_product_tags(mappings,  session_id)
        current_app.logger.info('Saved product mappings')

        return success_response({
            'message': f'Successfully saved {len(mappings)} product mappings',
            'total_saved': result['total_saved']
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to save mappings: {str(e)}')
        return error_response(f'Failed to save mappings: {str(e)}', 500)
    

@main.route('/consolidate-files', methods=['POST'])
def consolidate_files():
    """Consolidate all uploaded files into a single table"""
    try:
        data = request.get_json()
        
        if not data or 'files_data' not in data or 'session_id' not in data:
            return error_response('Files data and session_id are required', 400)
        
        files_data = data['files_data']
        session_id = data['session_id']
        
        product_tag_mapping = db_service.get_product_tag_mapping(session_id)
        # Consolidate files using visualization service
        result = visualization_service.consolidate_transaction_files(files_data, product_tag_mapping, session_id)
        db_service.save_transaction_product_tags(result['data'])
        db_service.save_transactions(result['data'])
        current_app.logger.info(f'Saved {result['total_transactions']} transactions')

        return success_response({
            'message': 'Files consolidated successfully',
            'total_transactions': result['total_transactions'],
            'files_processed': result['files_processed']
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to consolidate files: {str(e)}')
        return error_response(f'Failed to consolidate files: {str(e)}', 500)


@main.route('/download/consolidate-files', methods=['POST'])
def download_consolidate_files():
    try:
        data = request.get_json()
        if not data or 'files_data' not in data or 'session_id' not in data:
            return error_response('Files data and session_id are required', 400)
        
        files_data = data['files_data']
        session_id = data['session_id']
        
        # Consolidate files using visualization service
        visualization_service.consolidate_transaction_files(files_data, session_id)
        
        return success_response({
            'message': 'Files consolidated successfully',
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to consolidate files: {str(e)}')
        return error_response(f'Failed to consolidate files: {str(e)}', 500)
    
@main.route('/categorize-expenses', methods=['POST'])
def categorize_expenses():
    """Map product tags to transaction data with optional AI categorization"""
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data:
            return error_response('Data and session_id are required', 400)
        
        use_ai = data.get('use_ai', False)
        session_id = data['session_id']
    
        if use_ai:
            current_app.logger.info(f'Use AI set to : {str(use_ai)}')
            session_id = data['session_id']
            empty_products = db_service.get_empty_products(session_id)
            result = visualization_service.categorize_transactions(
                empty_products = empty_products
            )
            db_service.update_product_tags_in_db(result, session_id)
        
        return success_response({
            'message': 'Expense categorization completed',
        })
        
    except Exception as e:
        current_app.logger.error(f'Failed to categorize expenses: {str(e)}')
        return error_response(f'Failed to categorize expenses: {str(e)}', 500)
    

@main.route('/edit', methods=['POST'])
def get_transactions():
    try:
        session_id = request.json.get('session_id')
        if not session_id:
            return jsonify({'success': False, 'error': 'Session ID is required'}), 400

        transactions = Transactions.query.filter_by(session_id=session_id).all()

        return jsonify({
            'success': True,
            'data': [{
                'id': t.id,
                'date': t.transaction_date.isoformat() if t.transaction_date else None,
                'narration': t.narration,
                'product': t.product,
                'debit_amount': float(t.debit_amount or 0),
                'credit_amount': float(t.credit_amount or 0),
                'tag': t.tag,
                'mode': t.mode
            } for t in transactions]
        })
    except Exception as e:
        current_app.logger.error(f'Failed to edit: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@main.route('/update-product', methods=['POST'])
def update_product():
    data = request.get_json()
    transaction_id = data.get('transactionId')
    session_id = data.get('sessionId')
    old_product = data.get('oldProduct')
    new_product = data.get('newProduct')
    replace_all = data.get('replaceAll')
    tag = data.get('tag')

    try:
        if replace_all:
            # Update all products in ProductTag
            product_tags_to_update = ProductTag.query.filter_by(session_id=session_id, product=old_product).all()
            for product_tag in product_tags_to_update:
                product_tag.product = new_product

            # Update all products in Transactions
            expenses_to_update = Transactions.query.filter_by(session_id=session_id, product=old_product).all()
            for expense in expenses_to_update:
                expense.product = new_product
        else:
            # Add new ProductTag
            new_product_tag = ProductTag(session_id=session_id, product=new_product, tag=tag)
            expense = Transactions.query.filter_by(id=transaction_id).first()
            if expense:
                expense.product = new_product
            db_service._commit(new_product_tag)

        db_service.commit_changes()
        return jsonify({'success': True, 'message': 'Product updated successfully'}), 200
    except Exception as e:
        current_app.logger.error(f'Error in product update: {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500


@main.route('/update-tag', methods=['POST'])
def update_transaction_tag():
    try:
        data = request.json
        session_id = data.get('sessionId')
        product = data.get('product')
        new_tag = data.get('newTag')

        # Update or insert ProductTag
        existing_entry = ProductTag.query.filter_by(session_id=session_id, product=product).first()
        if existing_entry:
            existing_entry.tag = new_tag
        else:
            new_entry = ProductTag(session_id=session_id, product=product, tag=new_tag)
            db_service._commit(new_entry)
        
        # Update transactions
        expenses_to_update = Transactions.query.filter_by(session_id=session_id, product=product).all()
        for expense in expenses_to_update:
            expense.tag = new_tag

        db_service.commit_changes()
        return jsonify({'success': True, 'message': 'Tag updated successfully'}), 200
    except Exception as e:
        current_app.logger.error(f'Error in tag update : {str(e)}')
        return jsonify({'success': False, 'error': str(e)}), 500

BUCKET_NAME = "terra-upload"
ALLOWED_EXTENSIONS = {"csv", "pdf", "xls", "xlsx"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_FILES = 4


@main.route("/generate_upload_urls", methods=["POST"])
def generate_upload_urls():
    uploaded_files = []
    files = request.json.get("files")  # Expect [{ filename, size }, ...]
    if not files:
        return jsonify({"error": "No files provided"}), 400

    if len(files) > MAX_FILES:
        return jsonify({"error": f"Max {MAX_FILES} files allowed"}), 400

    presigned_urls = []

    for file in files:
        filename = file.get("filename")
        size = file.get("size")

        if not filename or not allowed_file(filename):
            return jsonify({"error": f"File type not allowed: {filename}"}), 400

        if size and size > MAX_FILE_SIZE:
            return jsonify({"error": f"File too large: {filename}"}), 400

        content_type = "application/octet-stream"
        ext = filename.rsplit(".", 1)[1].lower()
        if ext == "csv":
            content_type = "text/csv"
            file_type = "csv"
        elif ext in ["xls", "xlsx"]:
            content_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            file_type = "excel"
        elif ext == "pdf":
            content_type = "application/pdf"
            file_type = "pdf"
        else:
            file_type = "other"

        url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": filename,
                "ContentType": content_type,
            },
            ExpiresIn=900,  # 15 minutes
        )

        # 2. After client uploads, we can fetch back for password protection check
        # (Optional step - might be better as a separate /check_password route)
        try:
            obj = s3_client.get_object(Bucket=BUCKET_NAME, Key=filename)
            file_bytes = obj["Body"].read()
            is_protected = check_password_protection(file_bytes, file_type)
            current_app.logger.info(f"Password protection : {is_protected}")
        except Exception as e:
            current_app.logger.error(f"Could not check password protection for {filename}: {e}")
            is_protected = False

        presigned_urls.append({"filename": filename, "upload_url": url, "s3_key": filename, "is_password_protected": is_protected})

    return jsonify({"urls": presigned_urls})