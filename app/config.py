import os
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQL_DB_URI = (
        f"mysql+pymysql://{os.environ.get('DB_USERNAME')}:{os.environ.get('DB_PASSWORD')}"
        f"@{os.environ.get('DB_HOST')}:{os.environ.get('DB_PORT')}/{os.environ.get('DB_NAME')}"
    )
    CHAT_GPT_API_KEY = os.getenv('CHAT_GPT_API_KEY')
    LOG_TO_STDOUT = os.environ.get('LOG_TO_STDOUT')
    ALLOWED_EXTENSIONS = {'csv'}  # Allowed file extensions for uploads
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # Maximum file upload size: 16MB
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # To disable FSADeprecationWarning

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('PRODUCTION_DATABASE_URI')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('TESTING_DATABASE_URI')