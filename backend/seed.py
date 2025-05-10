from app import app, db
from models import Patient, Appointment, CheckIn, Measurement, Document, LifestyleRecord
from datetime import datetime

with app.app_context():
    db.drop_all()
    db.create_all()

    # Create a patient
    patient = Patient(
        name="Jane Doe",
        dob=datetime(1990, 5, 14),
        gender="female",
        email="jane.doe@example.com",
        phone="123-456-7890"
    )
    db.session.add(patient)
    db.session.commit()

    # Add appointment
    appointment = Appointment(
        patient_id=patient.id,
        scheduled_at=datetime(2025, 5, 10, 14, 30),
        symptom_description="Headache and fatigue"
    )
    db.session.add(appointment)
    db.session.commit()

    # Add check-in
    checkin = CheckIn(
        appointment_id=appointment.id
    )
    db.session.add(checkin)
    db.session.commit()

    # Add a lifestyle record
    lifestyle = LifestyleRecord(
        patient_id=patient.id,
        checkin_id=checkin.id,
        smoking_status="Never",
        alcohol_use="Occasional",
        exercise_frequency="3 times/week",
        diet_type="Vegetarian"
    )
    db.session.add(lifestyle)

    # Add a measurement
    measurement = Measurement(
        patient_id=patient.id,
        checkin_id=checkin.id,
        type="weight",
        value="70",
        unit="kg"
    )
    db.session.add(measurement)

    # Add a document
    document = Document(
        patient_id=patient.id,
        checkin_id=checkin.id,
        type="lab_result",
        original_filename="blood_test.pdf",
        file_path="/path/to/blood_test.pdf",
        extracted_text="Hemoglobin: 13.5 g/dL",
        structured_data={"hemoglobin": "13.5 g/dL"}
    )
    db.session.add(document)

    db.session.commit()

    print("🌱 Seed data inserted successfully.")