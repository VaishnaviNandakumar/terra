from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app, session
from .etl.extract import extract_data, extract_product_data
from .etl.transform import transform
from .etl.load import write_db
from .models import ProductTag
from .db_handler import DatabaseService
import pandas as pd

# Define the Blueprint for routes
main = Blueprint('main', __name__)
db_service = DatabaseService()

# Route for the home page
@main.route('/')
def index():
    db_service.add_session()
    return render_template('index.html')

@main.route('/logout')
def logout():
    session.clear()
    return render_template('logout.html')

@main.route('/upload', methods=['GET', 'POST'])
def upload_file():
    try:
        if request.method == 'POST':
            if 'file' not in request.files:
                current_app.logger.info('No file uploaded')
                flash('No file part')
                return redirect(request.url)

            file = request.files['file']
            
            if file.filename == '':
                current_app.logger.info('No selected file')
                flash('No selected file')
                return redirect(request.url)

            # Check if the file is a CSV
            if not allowed_file(file.filename):
                current_app.logger.info('File not in CSV format')
                flash('File is not in CSV format')
                return redirect('/')

            
            # Check if the file size exceeds 25 MB
            file.seek(0, 2)  # Move to the end of the file to check the size
            file_length = file.tell()
            if file_length > 25 * 1024 * 1024:  # 25 MB limit
                flash('File size exceeds the maximum limit of 25 MB')
                return redirect('/')
            file.seek(0)  # Reset file position to the beginning for reading
            try:
                file_content = file.read().decode('utf-8')
                input_data = extract_data(file_content)
                processed_data = transform(input_data)
                write_db(processed_data, session['current_session_id'])
                current_app.logger.info('File successfully processed and saved to the database')
                return redirect(url_for('main.index'))
            except Exception as e:
                current_app.logger.error(f'{e}')
                flash(f'Error processing file')
                return redirect('/')
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        flash("An internal error occurred. Please try again.")
        return redirect('/')
    
    return render_template('upload.html')

@main.route('/upload_tags', methods=['GET','POST'])
def upload_tags():
    try:
        if request.method == 'POST':
            if 'pdtFile' not in request.files:
                current_app.logger.info('No file uploaded')
                flash('No file part')
                return redirect(request.url)

            file = request.files['pdtFile']
            
            if file.filename == '':
                current_app.logger.info('No selected file')
                flash('No selected file')
                return redirect(request.url)

            # Check if the file is a CSV
            if not allowed_file(file.filename):
                current_app.logger.info('File not in CSV format')
                flash('File is not in CSV format')
                return redirect('/')

            
            # Check if the file size exceeds 25 MB
            file.seek(0, 2)  # Move to the end of the file to check the size
            file_length = file.tell()
            if file_length > 10 * 1024 * 1024:  # 25 MB limit
                flash('File size exceeds the maximum limit of 25 MB')
                return redirect('/')
            file.seek(0)  # Reset file position to the beginning for reading
            try:
                file_content = file.read().decode('utf-8')
                extract_product_data(file_content, session.get('current_session_id'))
                current_app.logger.info('File successfully processed and saved to the product_tags database')
                return redirect(url_for('main.index'))
            except Exception as e:
                current_app.logger.error(f'{e}')
                flash(f'Error processing file')
                return redirect('/')
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        flash("An internal error occurred. Please try again.")
        return redirect('/')
    
    return render_template('upload.html')
    
@main.route('/tags', methods=['GET', 'POST'])
def view_tags():
    session_id = session.get('current_session_id')
    current_app.logger.info(f"At session views tag {session_id}")
    page = request.args.get('page', 1, type=int) 
    search_tag = request.args.get('search_tag', '', type=str) 
    if search_tag:
        tags = ProductTag.query.filter(ProductTag.tag.ilike(f'%{search_tag}%'), ProductTag.session_id == session_id).paginate(page=page, per_page=30) 
    else:
        tags = ProductTag.query.filter(ProductTag.session_id == session_id).paginate(page=page, per_page=30)  # Paginate 30 records per page using keyword arguments

    if request.method == 'POST':
        # Get data from the form
        tag_id = request.form['tag_id']
        new_product = request.form['product']
        new_tags = request.form['tag']
        # Find the record by ID and update it
        tag_record = ProductTag.query.get(tag_id)
        if tag_record:
            tag_record.product = new_product
            tag_record.tag = new_tags
            db_service.commit_changes()
            flash('Tag updated successfully!', 'success')
        else:
            flash('Record not found!', 'error')

        return redirect(url_for('main.view_tags', page=page, search_tag=search_tag))

    return render_template('tags.html', tags=tags, search_tag=search_tag)


# Route for viewing expenses (e.g., a dashboard)
@main.route('/expenses')
def view_expenses():
    return render_template('grafana.html')


# Helper function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}


