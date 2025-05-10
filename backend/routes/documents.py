from utils.ocr_processing import main as process_document
from services.document_service import save_to_db
from create_app import create_app

def process_and_save_document(file_path, file_type=None, patient_id=None, checkin_id=None):
    result = process_document(file_path, file_type, patient_id, checkin_id)
    if result:
        app = create_app()
        with app.app_context():
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
            except Exception as e:
                print(f"Error saving document to database: {e}")
