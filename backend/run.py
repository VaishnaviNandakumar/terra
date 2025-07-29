#!/usr/bin/env python3
from flask import Flask
import logging
from config import Config
from db.db_handler import DatabaseService  
from db.models import db  
from routes import main  
from flask_cors import CORS
from logging.handlers import RotatingFileHandler
import os


app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")

# Register blueprint

app.register_blueprint(main, url_prefix='/api')
app.secret_key = 'your_secret_key'  # Required for session handling
CORS(app, resources={
    r"/static/*": {"origins": "http://localhost:5173"},
    rf"/api/*": {
        "origins": ["http://localhost:5173"],  # Support multiple origins from .env
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})



if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)

# - Save data into DB
# - Save PDT into DB
# - Mapping
# - AI Parsing
# - Edit Transaction
# - Cleaning Data 
# - Visualisation