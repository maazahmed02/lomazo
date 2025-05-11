import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

# Google Cloud settings
GOOGLE_CLOUD_PROJECT_ID = os.environ.get('GOOGLE_CLOUD_PROJECT_ID', 'avi-cdtm-hack-team-4688')
GOOGLE_CLOUD_REGION = os.environ.get('GOOGLE_CLOUD_REGION', 'europe-west3')

# Flask settings
SECRET_KEY = os.environ.get('FLASK_SECRET_KEY', 'dev-secret-key-please-change-in-production')
DEBUG = os.environ.get('FLASK_DEBUG', '1') == '1'
PORT = int(os.environ.get('FLASK_PORT', 5050))

# API settings
BACKEND_API_URL = os.environ.get('BACKEND_API_URL', 'http://localhost:5050/api')
