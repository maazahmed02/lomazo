from flask import Blueprint, request, jsonify
from extensions import db
from lomazo.backend.models.models import FamilyHistoryRecord

familyhistory_bp = Blueprint('familyhistory', __name__)

@familyhistory_bp.route('/familyhistory', methods=['POST'])
def add_family_history():
    data = request.get_json()
    new_history = FamilyHistoryRecord(
        patient_id=data['patient_id'],
        relation=data['relation'],
        condition=data['condition']
    )
    db.session.add(new_history)
    db.session.commit()
    return jsonify({'message': 'Family history record added successfully'}), 201