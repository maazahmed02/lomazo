import pyheif
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
import requests  # For making HTTP requests to the API endpoint

from models.models import db, Document
from app import app

# Set your API endpoint and key
api_endpoint = 'https://codestral.mistral.ai/v1/chat/completions'
api_key = os.environ.get("MISTRAL_API_KEY")
if not api_key:
    raise ValueError("MISTRAL_API_KEY environment variable not set!")


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

def process_text_with_ai(text):
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    data = {
        'prompt': f"Process the following extracted text: {text}",
        'max_tokens': 150,  # Adjust as needed
        'temperature': 0.7,  # Adjust as needed
    }

    response = requests.post(api_endpoint, headers=headers, json=data)

    if response.status_code == 200:
        return response.json().get('choices', [{}])[0].get('text', '').strip()
    else:
        return f"Error: Received status code {response.status_code} from API"
    
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
    with app.app_context():
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
    if not api_key or api_key == "default_api_key_if_not_set":
        raise ValueError("API key not found in environment variables.")

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
    summary = process_text_with_ai(text)
    print("AI Response:")
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
    file_path = 'test_data/MATRULLO_ZOE_20240925_5639.pdf'
    main(file_path)
