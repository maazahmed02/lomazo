from utils.ocr_processing import process_document

# Test the process_document function
if __name__ == "__main__":
    # Test file path
    file_path = "test_data/MATRULLO_ZOE_20240925_5639.pdf"

    # Call the function with test metadata
    result = process_document(file_path, file_type="PDF", patient_id="12345", checkin_id="67890")

    # Print the result
    print("Processing Result:")
    print(result)