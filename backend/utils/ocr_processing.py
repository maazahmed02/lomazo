from PIL import Image
import pytesseract
from pdf2image import convert_from_path
import os
import requests  # For making HTTP requests to the API endpoint
from flask import current_app
from extensions import db
from models.models import Document
import traceback
import re
from googletrans import Translator
from langdetect import detect as langdetect

# Set your API endpoint and key
PROJECT_ID = "avi-cdtm-hack-team-4688"  # Replace with your Google Cloud Project ID
REGION = "europe-west3"  # Choose a region where Gemini is available

# Initialize translator
translator = Translator()

def detect_language(text):
    """Detect the language of the extracted text"""
    try:
        # Skip if text is too short or empty
        if not text or len(text) < 20:
            return 'en'
        
        # Try with langdetect first (more reliable)
        try:
            return langdetect(text[:1000])
        except:
            # Fall back to googletrans
            detection = translator.detect(text[:1000])
            return detection.lang
    except Exception as e:
        traceback.print_exc()
        return 'en'  # Default to English on error

def translate_text(text, source_lang, target_lang):
    """Translate text to target language"""
    if not text or source_lang == target_lang:
        return text, False
    
    try:
        # Translate text in chunks to avoid API limits
        max_chunk_size = 1000
        chunks = split_into_chunks(text, max_chunk_size)
        translated_chunks = []
        
        for chunk in chunks:
            if chunk.strip():
                translation = translator.translate(chunk, src=source_lang, dest=target_lang)
                translated_chunks.append(translation.text)
            else:
                translated_chunks.append(chunk)
        
        return ' '.join(translated_chunks), True
    except Exception as e:
        traceback.print_exc()
        return text, False  # Return original on error

def split_into_chunks(text, max_length):
    """Split text into chunks of specified maximum length at sentence boundaries"""
    chunks = []
    current_chunk = ""
    
    # Split on sentence endings (., !, ?)
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) <= max_length:
            current_chunk += sentence + " "
        else:
            chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def extract_text_from_image(file_path):
    try:
        image = Image.open(file_path)
        return pytesseract.image_to_string(image)
    except Exception as e:
        traceback.print_exc()
        return f"Error processing image: {str(e)}"

def extract_text_from_pdf(file_path):
    try:
        # First attempt to use PyPDF2 (pure Python library) instead of pdf2image
        import PyPDF2
        
        text = ""
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                num_pages = len(reader.pages)
                
                for i in range(num_pages):
                    page = reader.pages[i]
                    text += f"\n--- Page {i+1} ---\n"
                    text += page.extract_text() or "[No text extracted]"
                
                if text.strip():
                    return text
                else:
                    # If no text was extracted, fall back to file info
                    raise Exception("No text content found in PDF")
        except Exception as e:
            # Continue to fallback method
            pass
            
        # If PyPDF2 fails, try convert_from_path as a fallback
        try:
            images = convert_from_path(file_path)
            text = ''
            for i, img in enumerate(images):
                text += f"\n--- Page {i+1} ---\n"
                text += pytesseract.image_to_string(img)
            return text
        except Exception as e:
            # Continue to final fallback
            pass
            
        # Final fallback - just return file info
        filesize = os.path.getsize(file_path)
        filename = os.path.basename(file_path)
        return f"PDF document: {filename} (Size: {filesize} bytes). Unable to extract text due to library issues."
    except Exception as e:
        traceback.print_exc()
        
        # Final fallback - try to at least return the file info
        try:
            filesize = os.path.getsize(file_path)
            filename = os.path.basename(file_path)
            return f"PDF document: {filename} (Size: {filesize} bytes). Unable to extract text: {str(e)}"
        except:
            return f"Error processing PDF: {str(e)}"

def handle_heic(file_path):
    try:
        temp_path = file_path.replace(".heic", ".jpg")
        os.system(f'sips -s format jpeg "{file_path}" --out "{temp_path}"')
        return temp_path
    except Exception as e:
        traceback.print_exc()
        return None

def process_text_with_gemini(text):
    try:
        # Detect the original language
        original_language = detect_language(text)
        original_language_name = get_language_name(original_language)
        
        # Store the original text
        original_text = text
        
        # Create translations dict to store all versions
        translations = {
            "original": {
                "code": original_language,
                "name": original_language_name,
                "text": original_text
            }
        }
        
        # Translate to English if not already in English
        if original_language != 'en':
            english_text, was_translated = translate_text(original_text, original_language, 'en')
            translations["english"] = {
                "code": "en",
                "name": "English",
                "text": english_text,
                "translated": was_translated
            }
        else:
            # If already English, just copy
            translations["english"] = {
                "code": "en",
                "name": "English",
                "text": original_text,
                "translated": False
            }
        
        # Translate to German
        german_text, was_translated = translate_text(
            translations["english"]["text"] if original_language != 'de' else original_text,
            'en' if original_language != 'de' else original_language,
            'de'
        )
        translations["german"] = {
            "code": "de",
            "name": "German",
            "text": german_text,
            "translated": was_translated
        }
        
        # Use English for processing and generating the summary
        document_type = get_document_type(translations["english"]["text"])
        
        # Generate medical summaries in each language
        summaries = {}
        
        # English summary (base summary)
        english_summary = generate_medical_summary(translations["english"]["text"], document_type)
        summaries["english"] = english_summary
        
        # Original language summary (if not English)
        if original_language != 'en':
            # Translate the English summary back to original language
            original_summary, _ = translate_text(english_summary, 'en', original_language)
            summaries["original"] = original_summary
        else:
            summaries["original"] = english_summary
        
        # German summary
        german_summary, _ = translate_text(english_summary, 'en', 'de')
        summaries["german"] = german_summary
        
        # Create the final structured response with all languages
        response = {
            "document_type": document_type,
            "original_language": {
                "code": original_language,
                "name": original_language_name
            },
            "translations": translations,
            "summaries": summaries
        }
        
        return response
    except Exception as e:
        traceback.print_exc()
        return {
            "error": f"Error processing text: {str(e)}",
            "original_text": text,
            "document_type": "Unknown"
        }

def generate_medical_summary(text, document_type):
    """Generate a concise, clinically-relevant summary of the medical document"""
    
    # Create different summary templates based on document type
    if document_type == "Laboratory Report":
        return summarize_lab_report(text)
    elif document_type == "Prescription or Medication Instructions":
        return summarize_prescription(text)
    elif document_type == "Clinical Note or Assessment":
        return summarize_clinical_note(text)
    elif document_type == "Imaging Report":
        return summarize_imaging_report(text)
    elif document_type == "Insurance Document":
        return summarize_insurance_document(text)
    else:
        return summarize_general_medical_document(text)

def extract_numeric_values(text):
    """Extract numeric values with their units and potential labels"""
    # Pattern for numeric values with units (e.g., 120 mg/dL, 78 bpm)
    pattern = r'(\d+\.?\d*)\s*([a-zA-Z/%]+)'
    matches = re.findall(pattern, text)
    
    # Extract numbers with potential labels (e.g., Glucose: 120)
    label_pattern = r'([A-Za-z\s]+):\s*(\d+\.?\d*)\s*([a-zA-Z/%]*)'
    labeled_matches = re.findall(label_pattern, text)
    
    results = []
    # Process numeric values with units
    for value, unit in matches:
        results.append(f"{value} {unit}")
    
    # Process labeled values
    for label, value, unit in labeled_matches:
        if label.strip() and value:
            results.append(f"{label.strip()}: {value} {unit}".strip())
    
    return results

def extract_dates(text):
    """Extract dates from the text"""
    # Various date formats
    date_patterns = [
        r'\d{1,2}/\d{1,2}/\d{2,4}',  # MM/DD/YYYY or DD/MM/YYYY
        r'\d{1,2}-\d{1,2}-\d{2,4}',  # MM-DD-YYYY or DD-MM-YYYY
        r'[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4}',  # Month DD, YYYY
        r'\d{1,2}\s+[A-Za-z]{3,9},?\s+\d{4}'   # DD Month YYYY
    ]
    
    dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text)
        dates.extend(matches)
    
    return dates

def extract_medications(text):
    """Extract medication names and dosages"""
    # Common medication suffixes and dosage patterns
    med_patterns = [
        r'([A-Za-z]+(?:cillin|mycin|oxacin|oxin|zepam|statin|sartan|pril|ide|olol|parin|ine|one|zole|mab))\s+(\d+\.?\d*\s*(?:mg|mcg|g|ml|%|mg/ml|mg/g|IU))',
        r'([A-Za-z]+(?:-[A-Za-z]+)?)\s+(\d+\.?\d*\s*(?:mg|mcg|g|ml|%|mg/ml|mg/g|IU))'
    ]
    
    medications = []
    for pattern in med_patterns:
        matches = re.findall(pattern, text)
        for med, dose in matches:
            medications.append(f"{med} {dose}")
    
    # Look for specific instructions
    instructions = re.findall(r'Take\s+(.+?)(?:\.|\n)', text)
    
    return medications, instructions

def summarize_lab_report(text):
    """Extract and summarize key information from a lab report"""
    summary = ""
    
    # Extract test names, values, and reference ranges
    test_patterns = [
        r'([A-Za-z\s]+):\s*(\d+\.?\d*)\s*([a-zA-Z/%]*)\s*(?:\(Reference:?\s*(\d+\.?\d*\s*-\s*\d+\.?\d*\s*[a-zA-Z/%]*)\))?',
        r'([A-Za-z\s]+)\s*(\d+\.?\d*)\s*([a-zA-Z/%]*)\s*(?:Reference Range:?\s*(\d+\.?\d*\s*-\s*\d+\.?\d*\s*[a-zA-Z/%]*))?'
    ]
    
    abnormal_results = []
    normal_results = []
    
    for pattern in test_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            test_name, value, unit, reference = match
            test_name = test_name.strip()
            if test_name and value:
                result = f"{test_name}: {value} {unit}"
                
                # Try to determine if abnormal
                if reference:
                    if '-' in reference:
                        try:
                            ref_range = reference.split('-')
                            low = float(ref_range[0].strip().split()[0])
                            high = float(ref_range[1].strip().split()[0])
                            value_num = float(value)
                            
                            if value_num < low or value_num > high:
                                abnormal_results.append(f"{result} (Abnormal, ref: {reference})")
                            else:
                                normal_results.append(result)
                        except:
                            normal_results.append(result)
                    else:
                        normal_results.append(result)
                else:
                    normal_results.append(result)
    
    # Extract dates
    dates = extract_dates(text)
    collection_date = dates[0] if dates else "Unknown date"
    
    # Build the summary
    summary += f"Report date: {collection_date}\n\n"
    
    if abnormal_results:
        summary += "ABNORMAL FINDINGS:\n"
        for result in abnormal_results:
            summary += f"- {result}\n"
        summary += "\n"
    
    summary += "OTHER TEST RESULTS:\n"
    for result in normal_results[:10]:  # Limit to top 10 normal results to avoid clutter
        summary += f"- {result}\n"
    
    if len(normal_results) > 10:
        summary += f"- Plus {len(normal_results) - 10} additional normal test results\n"
    
    return summary

def summarize_prescription(text):
    """Extract and summarize key information from a prescription"""
    medications, instructions = extract_medications(text)
    
    # Extract patient information
    patient_name = re.search(r'(?:Name|Patient):\s*([A-Za-z\s]+)', text)
    patient_name = patient_name.group(1).strip() if patient_name else "Unknown patient"
    
    # Extract doctor information
    doctor = re.search(r'(?:Dr\.|Doctor|Physician)[\s:]*((?:[A-Za-z]+\s*)+)', text)
    doctor = doctor.group(1).strip() if doctor else "Unknown doctor"
    
    # Extract dates
    dates = extract_dates(text)
    prescription_date = dates[0] if dates else "Unknown date"
    
    # Extract any refill information
    refills = re.search(r'Refills?:\s*(\d+|zero|none)', text, re.IGNORECASE)
    refills = refills.group(1) if refills else "Not specified"
    
    # Build the summary
    summary = f"Patient: {patient_name}\n"
    summary += f"Prescribed by: {doctor}\n"
    summary += f"Date: {prescription_date}\n\n"
    
    summary += "MEDICATIONS:\n"
    if medications:
        for med in medications:
            summary += f"- {med}\n"
    else:
        summary += "- No specific medications identified\n"
    
    summary += "\nINSTRUCTIONS:\n"
    if instructions:
        for instruction in instructions:
            summary += f"- {instruction}\n"
    else:
        summary += "- No specific instructions identified\n"
    
    summary += f"\nRefills: {refills}"
    
    return summary

def summarize_clinical_note(text):
    """Extract and summarize key information from a clinical note"""
    # Extract sections
    chief_complaint = extract_section(text, ['chief complaint', 'presenting complaint', 'reason for visit'], 200)
    history = extract_section(text, ['history', 'history of present illness', 'past medical history'], 300)
    assessment = extract_section(text, ['assessment', 'impression', 'diagnosis'], 300)
    plan = extract_section(text, ['plan', 'recommendation', 'treatment'], 300)
    
    # Extract vital signs
    vitals = []
    vital_patterns = [
        r'BP:?\s*(\d{2,3}/\d{2,3})',
        r'HR:?\s*(\d{2,3})',
        r'RR:?\s*(\d{1,2})',
        r'Temp:?\s*(\d{2,3}\.?\d*)',
        r'SpO2:?\s*(\d{1,3}%)',
        r'Pulse:?\s*(\d{2,3})',
        r'Temperature:?\s*(\d{2,3}\.?\d*)',
        r'Blood Pressure:?\s*(\d{2,3}/\d{2,3})'
    ]
    
    for pattern in vital_patterns:
        match = re.search(pattern, text)
        if match:
            vitals.append(f"{pattern.split(':')[0]}: {match.group(1)}")
    
    # Build the summary
    summary = ""
    
    if chief_complaint:
        summary += f"CHIEF COMPLAINT:\n{chief_complaint}\n\n"
    
    if vitals:
        summary += "VITAL SIGNS:\n"
        for vital in vitals:
            summary += f"- {vital}\n"
        summary += "\n"
    
    if history:
        summary += f"HISTORY:\n{history}\n\n"
    
    if assessment:
        summary += f"ASSESSMENT:\n{assessment}\n\n"
    
    if plan:
        summary += f"PLAN:\n{plan}\n\n"
    
    if not summary.strip():
        # If no structured data was found, provide a general summary
        summary = "This appears to be a clinical note, but specific structured information couldn't be extracted. Key phrases:\n\n"
        sentences = re.split(r'[.!?]\s+', text)
        important_sentences = []
        
        keywords = ['diagnosis', 'assessment', 'treatment', 'recommend', 'follow up', 'medication', 'symptoms']
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                important_sentences.append(sentence)
        
        for i, sentence in enumerate(important_sentences[:5]):
            summary += f"{i+1}. {sentence}.\n"
    
    return summary

def summarize_imaging_report(text):
    """Extract and summarize key information from an imaging report"""
    # Extract sections
    exam_type = extract_section(text, ['exam', 'examination', 'procedure', 'study', 'scan'], 100)
    findings = extract_section(text, ['findings', 'result', 'observation'], 500)
    impression = extract_section(text, ['impression', 'conclusion', 'assessment', 'summary'], 300)
    
    # Build the summary
    summary = ""
    
    if exam_type:
        summary += f"EXAM TYPE:\n{exam_type}\n\n"
    
    if findings:
        summary += f"FINDINGS:\n{findings}\n\n"
    
    if impression:
        summary += f"IMPRESSION:\n{impression}\n\n"
    
    if not summary.strip():
        # If no structured data was found, provide a general summary
        summary = "This appears to be an imaging report, but specific structured information couldn't be extracted. Key phrases:\n\n"
        sentences = re.split(r'[.!?]\s+', text)
        important_sentences = []
        
        keywords = ['normal', 'abnormal', 'evident', 'present', 'absent', 'no evidence', 'unremarkable', 'remarkable']
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                important_sentences.append(sentence)
        
        for i, sentence in enumerate(important_sentences[:5]):
            summary += f"{i+1}. {sentence}.\n"
    
    return summary

def summarize_insurance_document(text):
    """Extract and summarize key information from an insurance document"""
    # Extract policy details
    policy_number = extract_first_match(text, [r'Policy\s*(?:#|Number|No\.?):\s*([A-Za-z0-9-]+)', r'Policy\s*ID:\s*([A-Za-z0-9-]+)'])
    member_id = extract_first_match(text, [r'Member\s*(?:ID|Number|#):\s*([A-Za-z0-9-]+)', r'ID\s*Number:\s*([A-Za-z0-9-]+)'])
    group_number = extract_first_match(text, [r'Group\s*(?:#|Number|No\.?):\s*([A-Za-z0-9-]+)'])
    
    # Extract coverage info
    effective_date = extract_first_match(text, [r'Effective\s*Date:\s*([A-Za-z0-9/-]+)', r'Coverage\s*Begins:\s*([A-Za-z0-9/-]+)'])
    expiration_date = extract_first_match(text, [r'Expiration\s*Date:\s*([A-Za-z0-9/-]+)', r'Coverage\s*Ends:\s*([A-Za-z0-9/-]+)', r'Expires:\s*([A-Za-z0-9/-]+)'])
    
    # Extract provider/payer
    provider = extract_first_match(text, [r'(?:Insurance|Provider|Carrier|Plan):\s*([A-Za-z\s]+)', r'([A-Za-z]+\s+(?:Insurance|Health|Life))'])
    
    # Build the summary
    summary = "INSURANCE DETAILS:\n"
    
    if provider:
        summary += f"- Provider: {provider}\n"
    
    if policy_number:
        summary += f"- Policy Number: {policy_number}\n"
    
    if member_id:
        summary += f"- Member ID: {member_id}\n"
    
    if group_number:
        summary += f"- Group Number: {group_number}\n"
    
    if effective_date:
        summary += f"- Effective Date: {effective_date}\n"
    
    if expiration_date:
        summary += f"- Expiration Date: {expiration_date}\n"
    
    # Extract coverage details if available
    coverage_info = extract_section(text, ['coverage', 'benefits', 'covered', 'deductible', 'copay', 'co-pay'], 300)
    
    if coverage_info:
        summary += "\nCOVERAGE INFORMATION:\n"
        summary += coverage_info
    
    return summary

def summarize_general_medical_document(text):
    """Extract and summarize key information from a general medical document"""
    # Extract dates
    dates = extract_dates(text)
    document_date = dates[0] if dates else "Unknown date"
    
    # Extract numeric values
    values = extract_numeric_values(text)
    
    # Extract potential diagnoses
    diagnosis_pattern = r'(?:diagnosis|assessment|impression|condition)(?:\s*:|.{0,10})(.*?)(?:\.|$)'
    diagnoses = re.findall(diagnosis_pattern, text, re.IGNORECASE)
    
    # Extract potential treatments
    treatment_pattern = r'(?:treatment|plan|recommendation|therapy)(?:\s*:|.{0,10})(.*?)(?:\.|$)'
    treatments = re.findall(treatment_pattern, text, re.IGNORECASE)
    
    # Build the summary
    summary = f"Document date: {document_date}\n\n"
    
    if diagnoses:
        summary += "POTENTIAL DIAGNOSES/CONDITIONS:\n"
        for diagnosis in diagnoses[:3]:  # Limit to top 3
            if len(diagnosis.strip()) > 5:  # Skip very short matches
                summary += f"- {diagnosis.strip()}\n"
        summary += "\n"
    
    if treatments:
        summary += "POTENTIAL TREATMENTS/RECOMMENDATIONS:\n"
        for treatment in treatments[:3]:  # Limit to top 3
            if len(treatment.strip()) > 5:  # Skip very short matches
                summary += f"- {treatment.strip()}\n"
        summary += "\n"
    
    if values:
        summary += "NUMERIC VALUES DETECTED:\n"
        for value in values[:10]:  # Limit to top 10
            summary += f"- {value}\n"
    
    return summary

def extract_section(text, keywords, max_length=200):
    """Extract a section from text based on keywords"""
    for keyword in keywords:
        pattern = fr'(?i){re.escape(keyword)}(?:\s*:|.{{0,10}})(.*?)(?:(?:{"|".join([re.escape(k) for k in keywords if k != keyword])})|$)'
        matches = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if matches:
            content = matches.group(1).strip()
            # Limit length
            if len(content) > max_length:
                content = content[:max_length] + "..."
            return content
    return ""

def extract_first_match(text, patterns):
    """Extract the first match from a list of patterns"""
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return ""

def get_language_name(language_code):
    """Convert language code to readable language name"""
    language_map = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ru': 'Russian',
        'zh-cn': 'Chinese (Simplified)',
        'ja': 'Japanese',
        'ko': 'Korean',
        'ar': 'Arabic',
        'hi': 'Hindi',
        'nl': 'Dutch',
        'sv': 'Swedish',
        'fi': 'Finnish',
        'no': 'Norwegian',
        'da': 'Danish',
        'pl': 'Polish',
        'tr': 'Turkish',
        'el': 'Greek',
        'he': 'Hebrew',
        'bn': 'Bengali',
        'vi': 'Vietnamese',
        'th': 'Thai'
    }
    return language_map.get(language_code, f'Unknown ({language_code})')

def get_document_type(text):
    """Helper function to guess document type based on content"""
    text_lower = text.lower()
    
    if any(term in text_lower for term in ['lab', 'test', 'result', 'blood', 'sample', 'reference range']):
        return "Laboratory Report"
    elif any(term in text_lower for term in ['prescription', 'rx', 'take', 'daily', 'dose', 'medication']):
        return "Prescription or Medication Instructions"
    elif any(term in text_lower for term in ['diagnosis', 'assessment', 'plan', 'history', 'examination']):
        return "Clinical Note or Assessment"
    elif any(term in text_lower for term in ['x-ray', 'mri', 'ct', 'scan', 'imaging', 'radiograph']):
        return "Imaging Report"
    elif any(term in text_lower for term in ['insurance', 'policy', 'coverage', 'claim']):
        return "Insurance Document"
    else:
        return "Medical Document"

def format_document_response(response):
    """Format the response for better display in the frontend"""
    document_type = response["document_type"]
    original_language = response["original_language"]["name"]
    
    all_languages = {}
    
    # Format each language version
    for lang_key, lang_data in response["translations"].items():
        summary = response["summaries"].get(lang_key, "No summary available")
        
        formatted_text = f"Document Analysis by Gemini:\n\n"
        formatted_text += f"DOCUMENT OVERVIEW:\n"
        formatted_text += f"- Document type: {document_type}\n"
        formatted_text += f"- Original language: {original_language}\n"
        
        if lang_key != "original" and response["translations"][lang_key].get("translated", False):
            formatted_text += f"- Translated to {lang_data['name']}\n\n"
        else:
            formatted_text += "\n"
        
        formatted_text += f"CLINICAL SUMMARY:\n"
        formatted_text += f"{summary}\n\n"
        
        formatted_text += f"FULL DOCUMENT CONTENT:\n"
        if lang_key != "original" and response["translations"][lang_key].get("translated", False):
            formatted_text += f"[TRANSLATED FROM {original_language.upper()} TO {lang_data['name'].upper()}]\n\n"
        
        formatted_text += f"{lang_data['text']}\n"
        
        all_languages[lang_key] = formatted_text
    
    return all_languages

def save_to_db(file_path, extracted_text, ai_response, doc_type, patient_id=None, checkin_id=None):
    """
    Save document data into the database with multi-language support
    
    Args:
        file_path (str): Path to the uploaded file.
        extracted_text (str): OCR or parsed content.
        ai_response (dict): AI-parsed/processed result with all languages.
        doc_type (str): Type of document.
        patient_id (int, optional): Patient foreign key.
        checkin_id (int, optional): Check-in foreign key if applicable.
    """
    try:
        # Format the response for better display
        formatted_response = format_document_response(ai_response)
        
        with current_app.app_context():
            doc = Document(
                patient_id=patient_id,
                checkin_id=checkin_id,
                type=doc_type,
                original_filename=os.path.basename(file_path),
                file_path=file_path,
                extracted_text=extracted_text,
                structured_data={
                    "raw_response": ai_response,
                    "formatted": formatted_response,
                    "document_type": ai_response["document_type"],
                    "original_language": ai_response["original_language"],
                    "available_languages": list(formatted_response.keys())
                }
            )
            db.session.add(doc)
            db.session.commit()
            return doc.id
    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        return None

def main(file_path, doc_type, patient_id=None, checkin_id=None):
    try:
        ext = os.path.splitext(file_path)[-1].lower()

        if ext == '.pdf':
            text = extract_text_from_pdf(file_path)
        elif ext == '.heic':
            jpeg_path = handle_heic(file_path)
            if jpeg_path:
                text = extract_text_from_image(jpeg_path)
                os.remove(jpeg_path)
            else:
                text = "Error converting HEIC file."
        elif ext in ['.jpg', '.jpeg', '.png', '.tiff']:
            text = extract_text_from_image(file_path)
        else:
            text = f"Unsupported file type: {ext}"

        # Process the extracted text with the AI model
        ai_response = process_text_with_gemini(text)

        # Save the document to the database
        doc_id = save_to_db(
            file_path=file_path,
            extracted_text=text,
            ai_response=ai_response,
            doc_type=doc_type,
            patient_id=patient_id,
            checkin_id=checkin_id
        )
        
        return doc_id
    except Exception as e:
        traceback.print_exc()
        return None

if __name__ == "__main__":
    file_path = '/Users/zoe/Desktop/lomazo/backend/test_data/MATRULLO_ZOE_20240925_5639.pdf'
    doc_type = "lab_result"  # Example document type
    patient_id = 5           # Example patient ID
    checkin_id = None        # Example check-in ID (optional)
    main(file_path, doc_type, patient_id, checkin_id)
