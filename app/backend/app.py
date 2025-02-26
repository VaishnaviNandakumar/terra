from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=['http://localhost:3000']) 