from flask import Flask
from flask_cors import CORS
import os
from backend.extensions import db, migrate
from backend.routes.documents import documents_bp

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Database URI configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'instance', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register Blueprints

    app.register_blueprint(documents_bp, url_prefix='/documents')

    return app
