from flask import Blueprint, request, jsonify
from extensions import db
from lomazo.backend.models.models import Measurement

measurement_bp = Blueprint('measurement', __name__)

@measurement_bp.route('/measurement', methods=['POST'])
def add_measurement():
    data = request.get_json()
    new_measurement = Measurement(
        patient_id=data['patient_id'],
        checkin_id=data.get('checkin_id'),
        type=data['type'],
        value=data['value'],
        unit=data['unit'],
        recorded_on=data.get('recorded_on')
    )
    db.session.add(new_measurement)
    db.session.commit()
    return jsonify({'message': 'Measurement added successfully'}), 201