from flask import Blueprint, request, jsonify
from ..extensions import db
from ..models.models import PatientCondition

patientcondition_bp = Blueprint('patientcondition', __name__)

@patientcondition_bp.route('/patientcondition', methods=['POST'])
def add_patient_condition():
    data = request.get_json()
    new_condition = PatientCondition(
        patient_id=data['patient_id'],
        condition=data['condition'],
        diagnosed_on=data['diagnosed_on'],
        resolved_on=data.get('resolved_on')
    )
    db.session.add(new_condition)
    db.session.commit()
    return jsonify({'message': 'Patient condition added successfully'}), 201