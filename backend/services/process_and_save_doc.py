from flask import current_app
from ..utils.ocr_processing import main as process_document
from .document_service import save_to_db

def process_and_save_document(file_path, file_type=None, patient_id=None, checkin_id=None):
    """Process a document and save it to the database using the existing app context."""
    result = process_document(file_path, file_type, patient_id, checkin_id)
    if result:
        try:
            save_to_db(
                file_path=result["file_path"],
                extracted_text=result["extracted_text"],
                summary=result["summary"],
                doc_type=result["doc_type"],
                patient_id=result["patient_id"],
                checkin_id=result["checkin_id"]
            )
            print("Document saved to database.")
            return result
        except Exception as e:
            print(f"Error saving document to database: {e}")
            raise
    return None