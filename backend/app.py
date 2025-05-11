from flask import Flask, request, jsonify
from flask_cors import CORS
from extensions import db, migrate
from models.models import LifestyleRecord, Patient, Document
from datetime import datetime
from routes.documents import documents_bp
import os

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(basedir, 'instance', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db.init_app(app)
migrate.init_app(app, db)

# Register blueprints
app.register_blueprint(documents_bp, url_prefix='/api/documents')

# Create instance directory if it doesn't exist
os.makedirs(os.path.join(basedir, 'instance'), exist_ok=True)

@app.route('/api/lifestyle', methods=['POST'])
def lifestyle():
    data = request.json
    
    try:
        # Create a new lifestyle record
        lifestyle_record = LifestyleRecord(
            patient_id=1,  # You might want to get this from the request or session
            smoking_status=data.get('smoking_status'),
            alcohol_use=data.get('alcohol_consumption'),
            exercise_frequency=data.get('exercise_frequency'),
            diet_type=data.get('diet_type'),
            recorded_on=datetime.utcnow()
        )

        # Add to database
        db.session.add(lifestyle_record)
        db.session.commit()

        return jsonify({
            'message': 'Form data received and stored in database',
            'record_id': lifestyle_record.id
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({
            'error': 'Failed to store data in database',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create database tables if they don't exist
    app.run(debug=True, port=5050)