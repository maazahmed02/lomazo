from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os
from routes.documents import documents_bp

# Initialize Flask app
app = Flask(__name__)

# Database URI configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'instance', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db = SQLAlchemy(app)

# Initialize Migrate (for handling database migrations)
migrate = Migrate(app, db)

# Register Blueprints
app.register_blueprint(documents_bp, url_prefix='/documents')  # Prefix all document routes with /documents

# Import models (will use models from the models.py file)
from models import *

if __name__ == "__main__":
    app.run(debug=True)