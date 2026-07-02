import os
from dotenv import load_dotenv

# Load env file if available
load_dotenv()

class Config:
    # Flask Settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'kisanai360-super-secret-key-129847')
    PORT = int(os.environ.get('PORT', 5000))
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

    # Folder Paths
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')

    # Database Settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///' + os.path.join(BASE_DIR, 'kisanai360.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API Keys
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
    OPENWEATHER_API_KEY = os.environ.get('OPENWEATHER_API_KEY', '')
    
    # Configure Upload Folder on startup
    @classmethod
    def init_app(cls):
        if not os.path.exists(cls.UPLOAD_FOLDER):
            os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
            print(f"Created uploads folder at: {cls.UPLOAD_FOLDER}")
