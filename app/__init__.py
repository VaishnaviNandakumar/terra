from flask import Flask
from app.routes import main
from flask_sqlalchemy import SQLAlchemy  # Add this line
import logging
import os
from logging.handlers import RotatingFileHandler
from app.config import Config
from sqlalchemy import create_engine, text

# Initialize the SQLAlchemy database instance
db = SQLAlchemy()  # Initialize SQLAlchemy here


def create_app():
    # Initialize the Flask app
    app = Flask(__name__)
    app.config.from_object(Config)

    print(app.config['SQL_DB_URI'])
    app.db_engine = create_engine(app.config['SQL_DB_URI'])
    # Validate database connections
    validate_db_connection(app, app.db_engine, "EXPENSE_MGMT")
    app.register_blueprint(main, url_prefix='/')
    configure_logging(app)
    return app

def validate_db_connection(app, engine, engine_name):
    try:
        # Establish a connection and execute a simple query
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            # If the query is successful, log that the connection is established
            app.logger.info(f"Database connection for {engine_name} successful.")
    except Exception as e:
        # Log the error and raise an exception if the connection fails
        app.logger.error(f"Database connection failed: {str(e)}")
        raise Exception(f"Database connection failed for {engine_name}, please check your configuration.")

def configure_logging(app):
    if app.logger.handlers:
        for handler in app.logger.handlers:
            app.logger.removeHandler(handler)

    if app.config['DEBUG']:
        app.logger.setLevel(logging.DEBUG)
    else:
        app.logger.setLevel(logging.INFO)
    
    # Set formatter for logs
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

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
    
    app.logger.info('Expense Tracker startup')  # Log the startup event
