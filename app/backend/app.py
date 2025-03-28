import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API_BASE_URL and allowed origins
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:5000")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*")  # Allow all by default

app = Flask(__name__)

# More permissive CORS for development and production
CORS(app, resources={
    rf"{API_BASE_URL}/*": {
        "origins": ALLOWED_ORIGINS.split(","),  # Support multiple origins from .env
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/', methods=['GET', 'OPTIONS'])
def health_check():
    return {"status": "ok"}

if __name__ == '__main__':
    HOST = os.getenv("FLASK_RUN_HOST", "0.0.0.0")  # Default to all available IPs
    PORT = int(os.getenv("FLASK_RUN_PORT", 5000))  # Default to 5000

    app.run(debug=True, host=HOST, port=PORT)