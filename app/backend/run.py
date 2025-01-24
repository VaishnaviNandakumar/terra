from flask import Flask
from logging.handlers import RotatingFileHandler
import logging
import os
from config import Config
from db_handler import DatabaseService  
from models import db  
from routes import main  
from flask_cors import CORS

# Initialize the Flask app
app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
app.config.from_object(Config)
db.init_app(app)

# Register blueprint
app.register_blueprint(main, url_prefix='/')
CORS(app)  # Enable CORS for all routes
# Configure logging
def configure_logging(app):
    if app.logger.handlers:
        for handler in app.logger.handlers:
            app.logger.removeHandler(handler)

    # Set log level based on DEBUG setting
    if app.config['DEBUG']:
        app.logger.setLevel(logging.DEBUG)
    else:
        app.logger.setLevel(logging.INFO)

    # Set formatter for logs
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(module)s - %(funcName)s - %(message)s')

    if app.config.get('LOG_TO_STDOUT'):
        # Log to console (useful for cloud platforms like Heroku)
        stream_handler = logging.StreamHandler()
        stream_handler.setLevel(logging.DEBUG)
        stream_handler.setFormatter(formatter)
        app.logger.addHandler(stream_handler)
    else:
        # Log to a file with rotating logs
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler('logs/expense_tracker.log', maxBytes=10240, backupCount=10)
        file_handler.setLevel(logging.INFO)
        file_handler.setFormatter(formatter)
        app.logger.addHandler(file_handler)

    app.logger.info('Logging is configured.')

# Call logging configuration
configure_logging(app)

# Run the Flask application
if __name__ == '__main__':
    app.run(debug=True)
