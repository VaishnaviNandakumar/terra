from flask import Blueprint, render_template, request, flash, redirect, url_for, current_app
import pandas as pd
from io import StringIO
from app.etl.extract import extract_data
from app.etl.transform import transform
from app.etl.load import write_db


# Define the Blueprint for routes
main = Blueprint('main', __name__)

# Route for the home page
@main.route('/')
def index():
    return render_template('index.html')


@main.route('/upload', methods=['GET', 'POST'])
def upload_file():
    try:
        if request.method == 'POST':
            if 'file' not in request.files:
                flash('No file part')
                return redirect(request.url)

            file = request.files['file']
            
            if file.filename == '':
                flash('No selected file')
                return redirect(request.url)

            if file and allowed_file(file.filename):
                try:
                    file_content = file.read().decode('utf-8')
                    input_data = extract_data(file_content)
                    processed_data = transform(input_data)
                    load_data = write_db(processed_data)
                    current_app.logger.info('File successfully processed and saved to the database')
                    return redirect(url_for('main.index'))
                except Exception as e:
                    current_app.logger.error(f'{e}')
                    flash(f'Error processing file: {str(e)}')
                    return redirect(request.url)
    except Exception as e:
        current_app.logger.error(f"An error occurred while processing the upload: {e}")
        flash("An internal error occurred. Please try again.")
        return redirect(request.url)
    
    return render_template('upload.html')

    

# Route for viewing expenses (e.g., a dashboard)
@main.route('/expenses')
def view_expenses():
    return render_template('expenses.html', expenses=expenses)


# Helper function to check if the file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'csv'}
