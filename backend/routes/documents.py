from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import os
from backend.services.process_and_save_doc import process_and_save_document

documents_bp = Blueprint('documents', __name__)

UPLOAD_FOLDER = 'uploads/'
ALLOWED_EXTENSIONS = {'pdf', 'jpeg', 'jpg', 'png', 'heic'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/upload', methods=['POST'])
def upload_and_process_document():
    try:
        # Check if a file is part of the request
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed'}), 400

        # Save the uploaded file temporarily
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)

        # Dynamically get patient_id and checkin_id (mocked for now)
        patient_id = request.form.get('patient_id', 'dynamic_patient_id')
        checkin_id = request.form.get('checkin_id', 'dynamic_checkin_id')

        # Process the document using Gemini analysis
        result = process_document(file_path, file_type="PDF", patient_id=patient_id, checkin_id=checkin_id)

        # Extract information and file type from the result
        extracted_info = result.get('extracted_info', {})
        file_type = result.get('file_type', 'unknown')

        # Save the processed document to the database
        try:
            process_and_save_document(file_path, extracted_info, file_type, patient_id, checkin_id)
            return jsonify({'message': 'File uploaded, processed, and saved successfully', 'result': result}), 200
        except Exception as e:
            return jsonify({'error': f'Failed to save document: {str(e)}'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500
