import pyheif
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
import requests  # For making HTTP requests to the API endpoint

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

if __name__ == "__main__":
    file_path = 'test_data/MATRULLO_ZOE_20240925_5639.pdf'
    main(file_path)
