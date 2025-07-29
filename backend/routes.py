from flask import Blueprint, Flask, request, jsonify
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


main = Blueprint('main', __name__)
db_service = DatabaseService()


# Configuration
UPLOAD_FOLDER = "/Users/vaishnavink/Downloads/project-5/backend/upload/"
ALLOWED_EXTENSIONS = {'pdf', 'csv', 'xlsx', 'xls', 'txt', 'doc', 'docx'}

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

def check_password_protection(file_path, file_type):
    try:
        if file_type == 'pdf':
            return pdf_processor.is_password_protected(file_path)
        elif file_type == 'excel':
            return excel_processor.is_password_protected(file_path)
        else:
            return False
    except Exception as e:
        print(f"Password check error for {file_type}: {e}")
        return False
    
@main.route('/health', methods=['GET'])
def health_check():
    return success_response({'status': 'healthy', 'message': 'Backend is running'})

@main.route('/upload', methods=['POST'])
def upload_files():
    try:
        if 'files' not in request.files:
            return error_response('No files provided', 400)
        
        files = request.files.getlist('files')
        if not files or all(file.filename == '' for file in files):
            return error_response('No files selected', 400)
        
        uploaded_files = []
        
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                
                # Get file info
                file_size = os.path.getsize(file_path)
                file_type = get_file_type(filename)
                
                is_password_protected = check_password_protection(file_path, file_type)
                
                uploaded_files.append({
                    'filename': filename,
                    'file_path': file_path,
                    'size': file_size,
                    'type': file_type,
                    'supported': file_type in ['pdf', 'csv', 'excel'],
                    'is_password_protected': is_password_protected,
                    'password_required': is_password_protected
                })
        
        if not uploaded_files:
            return error_response('No valid files uploaded', 400)
        
        return success_response({
            'message': f'Successfully uploaded {len(uploaded_files)} files',
            'files': uploaded_files
        })
        
    except Exception as e:
        return error_response(f'Upload failed: {str(e)}', 500)

@main.route('/analyze', methods=['POST'])
def analyze_files():
    try:
        data = request.get_json()
        
        if not data or 'files' not in data:
            return error_response('No files data provided', 400)
        
        files_data = data['files']
        results = []
        
        for file_info in files_data:
            file_path = file_info.get('file_path')
            classification = file_info.get('classification', 'Unknown')
            filename = file_info.get('filename')
            password = file_info.get('password')
            
            if not file_path or not os.path.exists(file_path):
                results.append({
                    'filename': filename,
                    'status': 'error',
                    'message': 'File not found'
                })
                continue
            
            try:
                # Process based on file type
                file_loader = FileLoader()
                df = file_loader.load(file_path, password)
                df['Source'] = classification                    
                
                # Convert DataFrame to dict for JSON response
                df.replace({np.nan: None, np.inf: None, -np.inf: None}, inplace=True)
                transactions = df.to_dict('records')
                
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
                # Check if it's a password-related error
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
        sample_file_path = os.path.join(os.path.dirname(__file__), 'sample_data', 'product_mappings.csv')
        
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
        return success_response({
            'message': f'Successfully saved {len(mappings)} product mappings',
            'total_saved': result['total_saved']
        })
        
    except Exception as e:
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
        
        return success_response({
            'message': 'Files consolidated successfully',
            'total_transactions': result['total_transactions'],
            'files_processed': result['files_processed']
        })
        
    except Exception as e:
        print(e)
        return error_response(f'Failed to consolidate files: {str(e)}', 500)


@main.route('/download/consolidate-files', methods=['POST'])
def download_consolidate_files():
    try:
        data = request.get_json()
        
        
        if not data or 'files_data' not in data or 'session_id' not in data:
            return error_response('Files data and session_id are required', 400)
        
        files_data = data['files_data']
        print(files_data)
        session_id = data['session_id']
        
        # Consolidate files using visualization service
        # result = visualization_service.consolidate_transaction_files(files_data, session_id)
        
        return success_response({
            'message': 'Files consolidated successfully',
        })
        
    except Exception as e:
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
        return jsonify({'success': False, 'error': str(e)}), 500

