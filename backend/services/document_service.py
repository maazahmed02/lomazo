from flask import current_app
from extensions import db
from models import Document  # Import the Document model
import os  # Import the os module


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
        try:
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
            print(f"✅ Saved '{doc_type}' document for patient_id={patient_id} and checkin_id={checkin_id}")
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error saving document: {e}")