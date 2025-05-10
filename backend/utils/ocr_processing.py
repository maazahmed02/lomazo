from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
import requests  # For making HTTP requests to the API endpoint
from flask import current_app
from backend.extensions import db
from backend.models import Document
from google.cloud import aiplatform

# Set your API endpoint and key
PROJECT_ID = "avi-cdtm-hack-team-4688"  # Replace with your Google Cloud Project ID
REGION = "europe-west3"  # Choose a region where Gemini is available
aiplatform.init(project=PROJECT_ID, location=REGION)

def extract_text_from_image(file_path):
    image = Image.open(file_path)
    return pytesseract.image_to_string(image)

def extract_text_from_pdf(file_path):
    images = convert_from_path(file_path)
    text = ''
    for i, img in enumerate(images):
        text += f"\n--- Page {i+1} ---\n"
        text += pytesseract.image_to_string(img)
    return text

def handle_heic(file_path):
    temp_path = file_path.replace(".heic", ".jpg")
    os.system(f'sips -s format jpeg "{file_path}" --out "{temp_path}"')
    return temp_path

def process_text_with_gemini(text):
    model = aiplatform.GenerativeModel(model_name="gemini-pro") # Or "gemini-pro-vision" for multimodal

    prompt = f"Process the following extracted text: {text}"

    response = model.generate_content(
        prompt,
        generation_config={
            "max_output_tokens": 150,  # Adjust as needed
            "temperature": 0.7,      # Adjust as needed
            "top_p": 0.8,             # Optional: Adjust as needed
            "top_k": 40,             # Optional: Adjust as needed
        },
    )

    try:
        return response.text.strip()
    except AttributeError:
        return "Error: Could not extract text from Gemini response."

    
def save_to_db(file_path, extracted_text, summary, doc_type, patient_id=None, checkin_id=None):
    """
    Save document data into the database, with dynamic metadata.
    
    Args:
        file_path (str): Path to the uploaded file.
        extracted_text (str): OCR or parsed content.
        summary (str): AI-parsed/processed result.
        doc_type (str): Type of document: 'lab_result', 'insurance_card', etc.
        patient_id (int, optional): Patient foreign key.
        checkin_id (int, optional): Check-in foreign key if applicable.
    """
    with current_app.app_context():
        doc = Document(
            patient_id=patient_id,
            checkin_id=checkin_id,
            type=doc_type,
            original_filename=os.path.basename(file_path),
            file_path=file_path,
            extracted_text=extracted_text,
            structured_data={"summary": summary}
        )
        db.session.add(doc)
        db.session.commit()
        print(f"Saved '{doc_type}' document for patient_id={patient_id} and checkin_id={checkin_id}")

def main(file_path):

    ext = os.path.splitext(file_path)[-1].lower()

    if ext == '.pdf':
        print("Processing PDF...")
        text = extract_text_from_pdf(file_path)

    elif ext == '.heic':
        print("Converting HEIC to JPEG...")
        jpeg_path = handle_heic(file_path)
        text = extract_text_from_image(jpeg_path)
        os.remove(jpeg_path)

    elif ext in ['.jpg', '.jpeg', '.png', '.tiff']:
        print("Processing image...")
        text = extract_text_from_image(file_path)

    else:
        print(f"Unsupported file type: {ext}")
        return

    print("Extracted Text:")
    print(text)

    # Process the extracted text with the AI model
    summary = process_text_with_gemini(text)
    print("AI Response (Gemini):")
    print(summary)

    # Save the document to the database
    save_to_db(
    file_path=file_path,
    extracted_text=text,
    summary=summary,
    doc_type='insurance_card',        # UI sends this
    patient_id=5,                     # UI/session passes this
    checkin_id=None                   # Optional depending on flow
)

if __name__ == "__main__":
    file_path = '/Users/zoe/Desktop/lomazo/backend/test_data/MATRULLO_ZOE_20240925_5639.pdf'
    main(file_path)
