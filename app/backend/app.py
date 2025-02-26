from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# More permissive CORS for development
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

@app.route('/', methods=['GET', 'OPTIONS'])
def health_check():
    return {"status": "ok"}

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000) 