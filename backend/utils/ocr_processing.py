from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
from google.cloud import aiplatform
from google import genai
from google.genai import types
from services.document_service import save_to_db

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

    client = genai.Client(
        api_key="AIzaSyDOwegsiYWKvIsDiFUpOq_p-_urlv39MpI",
    )
    model = "gemini-2.5-pro-preview-05-06"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""Du erhältst nun einen Text, den ich aus medizinischen Dokumenten extrahiert habe. Ich möchte dein Modell nutzen, um die Informationen darin sehr einfach zusammenzufassen, damit die Ärztin oder der Arzt das eigentliche Dokument nicht vollständig lesen muss. Zuerst soll der Dokumenttyp genannt werden (z. B. Blutbild, Impfnachweis etc.), danach die wichtigsten medizinischen Informationen, die für die ärztliche Einschätzung relevant sind (z. B. Blutwerte bei einem Blutbild). Da ich deine Antwort direkt weiterverwende und in eine Webanwendung einbinde, bitte keine einleitenden Sätze vor der Zusammenfassung schreiben.
                """),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=f"""Process the following extracted text: {text}"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )
    full_response = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if chunk.text:
            print(chunk.text, end="")  # For streaming to terminal
            full_response += chunk.text

    return full_response

    

def main(file_path, file_type=None, patient_id=None, checkin_id=None):

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

    processed = process_text_with_gemini(text)

    try:
        save_to_db(
            file_path=file_path,
            extracted_text=text,
            summary=processed,
            doc_type=file_type,
            patient_id=patient_id,
            checkin_id=checkin_id
        )
        print("Document saved to database.")
    except Exception as e:
        print(f"Error saving document to database: {e}")

if __name__ == "__main__":
    file_path = 'test_data/MATRULLO_ZOE_20240925_5639.pdf'
    main(file_path)



