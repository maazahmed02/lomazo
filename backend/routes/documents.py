from flask import Blueprint, request, jsonify, current_app
from models.models import db, Document
from utils.ocr_processing import extract_text_from_image, extract_text_from_pdf, process_text_with_gemini, handle_heic
import os
import base64
import json
import tempfile
import traceback

# Create a blueprint for documents
documents_bp = Blueprint('documents', __name__)

# Define the route to upload a document
@documents_bp.route('/upload', methods=['POST'])
def upload_document():
    try:
        # Check if a file is part of the request
        if 'file' not in request.files:
            # Try to parse the raw data for web uploads
            content_type = request.headers.get('Content-Type', '')
            
            if 'multipart/form-data' in content_type:
                return jsonify({"message": "File not properly formatted"}), 400
            
            return jsonify({"message": "No file part"}), 400

        file = request.files['file']

        # If no file is selected
        if file.filename == '':
            return jsonify({"message": "No selected file"}), 400

        # Get the patient_id and file_type from the request
        patient_id = request.form.get('patient_id')
        file_type = request.form.get('file_type')

        if not patient_id or not file_type:
            return jsonify({"message": "Patient ID and file type are required"}), 400
        
        # Create temp directory if it doesn't exist
        temp_dir = os.path.join(current_app.root_path, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Save the file to a temporary location
        temp_file_path = os.path.join(temp_dir, file.filename)
        file.save(temp_file_path)

        # Extract text from the document based on the file extension
        ext = os.path.splitext(file.filename)[-1].lower()
        extracted_text = ""

        if ext == '.pdf':
            extracted_text = extract_text_from_pdf(temp_file_path)
        elif ext == '.heic':
            jpeg_path = handle_heic(temp_file_path)
            extracted_text = extract_text_from_image(jpeg_path)
            os.remove(jpeg_path)  # Clean up the temp file
        elif ext in ['.jpg', '.jpeg', '.png', '.tiff']:
            extracted_text = extract_text_from_image(temp_file_path)
        else:
            return jsonify({"message": f"Unsupported file type: {ext}"}), 400
        
        # Process the extracted text with the AI model
        ai_response = process_text_with_gemini(extracted_text)

        # Create and save the document record
        new_document = Document(
            patient_id=patient_id,
            file_path=temp_file_path,
            original_filename=file.filename,
            type=file_type,
            extracted_text=extracted_text,
            structured_data=ai_response
        )

        db.session.add(new_document)
        db.session.commit()

        return jsonify({
            "message": "Document uploaded and processed successfully", 
            "file_path": temp_file_path,
            "extracted_text": extracted_text,
            "ai_response": ai_response,
            "structured_data": {"summary": ai_response}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error processing document: {str(e)}"}), 500


# Define a new route to upload a document using base64 encoding
@documents_bp.route('/upload-base64', methods=['POST'])
def upload_document_base64():
    try:
        # Get the request data
        data = request.json
        
        if not data:
            return jsonify({"message": "No data in request"}), 400
        
        # Extract data from the request
        filename = data.get('filename')
        content_base64 = data.get('content')
        mime_type = data.get('mimeType')
        patient_id = data.get('patient_id')
        file_type = data.get('file_type')
        
        # Validate required fields
        if not filename or not content_base64 or not patient_id or not file_type:
            return jsonify({"message": "Missing required fields"}), 400
        
        # Create temp directory if it doesn't exist
        temp_dir = os.path.join(current_app.root_path, 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Decode the base64 content
        file_data = base64.b64decode(content_base64)
        
        # Save the file to a temporary location
        temp_file_path = os.path.join(temp_dir, filename)
        with open(temp_file_path, 'wb') as f:
            f.write(file_data)
        
        # Extract text from the document based on the file extension
        ext = os.path.splitext(filename)[-1].lower()
        extracted_text = ""
        
        if ext == '.pdf':
            extracted_text = extract_text_from_pdf(temp_file_path)
        elif ext == '.heic':
            jpeg_path = handle_heic(temp_file_path)
            extracted_text = extract_text_from_image(jpeg_path)
            os.remove(jpeg_path)  # Clean up the temp file
        elif ext in ['.jpg', '.jpeg', '.png', '.tiff']:
            extracted_text = extract_text_from_image(temp_file_path)
        else:
            return jsonify({"message": f"Unsupported file type: {ext}"}), 400
        
        # Process the extracted text with the AI model
        ai_response = process_text_with_gemini(extracted_text)
        
        # Create and save the document record
        new_document = Document(
            patient_id=patient_id,
            file_path=temp_file_path,
            original_filename=filename,
            type=file_type,
            extracted_text=extracted_text,
            structured_data=ai_response
        )
        
        db.session.add(new_document)
        db.session.commit()
        
        return jsonify({
            "message": "Document uploaded and processed successfully", 
            "file_path": temp_file_path,
            "extracted_text": extracted_text,
            "ai_response": ai_response,
            "structured_data": {"summary": ai_response}
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error processing document: {str(e)}"}), 500



