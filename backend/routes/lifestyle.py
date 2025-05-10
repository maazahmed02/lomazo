from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.models import LifestyleRecord

lifestyle_bp = Blueprint('lifestyle', __name__)

@lifestyle_bp.route('/lifestyle', methods=['POST'])
def add_lifestyle_record():
    data = request.get_json()
    new_lifestyle = LifestyleRecord(
        patient_id=data['patient_id'],
        checkin_id=data.get('checkin_id'),
        smoking_status=data['smoking_status'],
        alcohol_use=data['alcohol_use'],
        exercise_frequency=data['exercise_frequency'],
        diet_type=data['diet_type'],
        recorded_on=data.get('recorded_on')
    )
    db.session.add(new_lifestyle)
    db.session.commit()
    return jsonify({'message': 'Lifestyle record added successfully'}), 201