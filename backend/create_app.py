from flask import Flask
from flask_cors import CORS
import os
from config import SECRET_KEY

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # App configuration
    app.config['SECRET_KEY'] = SECRET_KEY

    # Register Blueprints
    from routes.documents import documents_bp
    app.register_blueprint(documents_bp, url_prefix='/documents')

    # Create temp directory if it doesn't exist
    basedir = os.path.abspath(os.path.dirname(__file__))
    os.makedirs(os.path.join(basedir, 'temp'), exist_ok=True)

    return app
