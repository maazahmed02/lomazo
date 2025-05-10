from flask import Blueprint, request, jsonify
from models.models import db, Document
from utils.ocr_processing import extract_text_from_image, extract_text_from_pdf, process_text_with_gemini, handle_heic
import os

# Create a blueprint for documents
documents_bp = Blueprint('documents', __name__)

# Define the route to upload a document
@documents_bp.route('/upload', methods=['POST'])
def upload_document():
    # Check if a file is part of the request
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400

    file = request.files['file']

    # If no file is selected
    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    # Get the patient_id and file_type from the request (make sure they are provided)
    patient_id = request.form.get('patient_id')
    file_type = request.form.get('file_type')

    if not patient_id or not file_type:
        return jsonify({"message": "Patient ID and file type are required"}), 400
    
    # Save the file to a temporary location
    temp_file_path = os.path.join('temp', file.filename)
    file.save(temp_file_path)

 # Create a new Document record in the database
    new_document = Document(
        patient_id=patient_id,  # Set patient_id dynamically
        file_path=temp_file_path,
        original_filename=file.filename,
        type=file_type  # Use the dynamically passed file type
    )

    # Save the document record in the database
    db.session.add(new_document)
    db.session.commit()

    # Extract text from the document based on the file extension
    ext = os.path.splitext(file.filename)[-1].lower()
    extracted_text = ""

    if ext == '.pdf':
        print("Processing PDF...")
        extracted_text = extract_text_from_pdf(temp_file_path)
    elif ext == '.heic':
        print("Converting HEIC to JPEG...")
        jpeg_path = handle_heic(temp_file_path)
        extracted_text = extract_text_from_image(jpeg_path)
        os.remove(jpeg_path)  # Clean up the temp file
    elif ext in ['.jpg', '.jpeg', '.png', '.tiff']:
        print("Processing image...")
        extracted_text = extract_text_from_image(temp_file_path)
    else:
        return jsonify({"message": f"Unsupported file type: {ext}"}), 400
    
     # Process the extracted text with the AI model (if necessary)
    ai_response = process_text_with_gemini(extracted_text)

    # Optionally, save the processed AI response in the database or return it in the response
    new_document.extracted_text = extracted_text  # Save the raw extracted text
    new_document.structured_data = ai_response  # Save the AI processed data (if applicable)

    # Call the save_to_db function from ocr_processing.py to save the document and extracted text to the database
    save_to_db(new_document)

    return jsonify({
        "message": "Document uploaded and processed successfully", 
        "file_path": temp_file_path,
        "extracted_text": extracted_text,
        "ai_response": ai_response
    }), 201



