from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.models import VaccinationRecord

vaccinationrecord_bp = Blueprint('vaccinationrecord', __name__)

@vaccinationrecord_bp.route('/vaccinationrecord', methods=['POST'])
def add_vaccination_record():
    data = request.get_json()
    new_record = VaccinationRecord(
        patient_id=data['patient_id'],
        vaccine_name=data['vaccine_name'],
        date_administered=data['date_administered']
    )
    db.session.add(new_record)
    db.session.commit()
    return jsonify({'message': 'Vaccination record added successfully'}), 201