from flask import Flask
from flask_cors import CORS
import os
from extensions import db, migrate

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import blueprints
    from backend.routes.documents import documents_bp
    from backend.routes.lifestyle import lifestyle_bp
    from backend.routes.measurement import measurement_bp
    from backend.routes.patientcondition import patientcondition_bp
    from backend.routes.vaccinationrecord import vaccinationrecord_bp
    from backend.routes.familyhistory import familyhistory_bp

    # Database URI configuration
    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'instance', 'app.db')}"
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register all blueprints with /api prefix
    app.register_blueprint(documents_bp, url_prefix='/api/documents')
    app.register_blueprint(lifestyle_bp, url_prefix='/api')
    app.register_blueprint(measurement_bp, url_prefix='/api')
    app.register_blueprint(patientcondition_bp, url_prefix='/api')
    app.register_blueprint(vaccinationrecord_bp, url_prefix='/api')
    app.register_blueprint(familyhistory_bp, url_prefix='/api')

    return app
