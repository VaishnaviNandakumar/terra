#!/usr/bin/env python3
from flask import Flask
import logging
from logging.handlers import RotatingFileHandler
import os
from config import Config
from db.db_handler import DatabaseService
from db.models import db
from routes import main
from flask_cors import CORS

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000/api")
app.register_blueprint(main, url_prefix='/api')
app.secret_key = 'your_secret_key'

CORS(app, resources={
    r"/static/*": {"origins": "http://localhost:5173"},
    rf"/api/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# ---------- Console Logging Setup ----------
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)  # Set to INFO in prod
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)

# Clear any default handlers (avoid duplicate logs in debug mode)
if app.logger.hasHandlers():
    app.logger.handlers.clear()

app.logger.addHandler(console_handler)
app.logger.setLevel(logging.DEBUG)

app.logger.info("Flask application started with console logging.")




if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
