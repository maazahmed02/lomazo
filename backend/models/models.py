from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from extensions import db  # Import db from extensions.py

# ------------------------------
# Patient Profile & Background
# ------------------------------

class Patient(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    dob = db.Column(db.Date)
    gender = db.Column(db.String(10))
    email = db.Column(db.String(120), unique=True)
    address = db.Column(db.String(120))
    phone = db.Column(db.String(20))
    
    appointments = db.relationship('Appointment', backref='patient', lazy=True)
    conditions = db.relationship('PatientCondition', backref='patient', lazy=True)
    vaccinations = db.relationship('VaccinationRecord', backref='patient', lazy=True)
    family_history = db.relationship('FamilyHistoryRecord', backref='patient', lazy=True)
    lifestyle_records = db.relationship('LifestyleRecord', backref='patient', lazy=True)
    measurements = db.relationship('Measurement', backref='patient', lazy=True)
    documents = db.relationship('Document', backref='patient', lazy=True)


# ------------------------------
# Appointments & Check-ins
# ------------------------------

class Appointment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    scheduled_at = db.Column(db.DateTime)
    symptom_description = db.Column(db.Text)
    
    checkin = db.relationship('CheckIn', uselist=False, backref='appointment', lazy=True)


class CheckIn(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointment.id'), nullable=False)
    checked_in_at = db.Column(db.DateTime, default=datetime.utcnow)

    measurements = db.relationship('Measurement', backref='checkin', lazy=True)
    documents = db.relationship('Document', backref='checkin', lazy=True)
    lifestyle = db.relationship('LifestyleRecord', backref='checkin', lazy=True)


# ------------------------------
# Long-Term Medical Data
# ------------------------------

class PatientCondition(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    condition = db.Column(db.String(100))
    diagnosed_on = db.Column(db.Date)
    resolved_on = db.Column(db.Date, nullable=True)


class VaccinationRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    vaccine_name = db.Column(db.String(100))
    date_administered = db.Column(db.Date)


class FamilyHistoryRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    relation = db.Column(db.String(50))  # e.g., "father"
    condition = db.Column(db.String(100))


class LifestyleRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    checkin_id = db.Column(db.Integer, db.ForeignKey('check_in.id'), nullable=True)
    smoking_status = db.Column(db.String(100))
    alcohol_use = db.Column(db.String(100))
    exercise_frequency = db.Column(db.String(100))
    diet_type = db.Column(db.String(100))
    recorded_on = db.Column(db.DateTime, default=datetime.utcnow)


# ------------------------------
# Measurements & Documents
# ------------------------------

class Measurement(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    checkin_id = db.Column(db.Integer, db.ForeignKey('check_in.id'), nullable=True)
    type = db.Column(db.String(50))  # e.g., weight, height, BP
    value = db.Column(db.String(50))
    unit = db.Column(db.String(20))
    recorded_on = db.Column(db.DateTime, default=datetime.utcnow)


class Document(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patient.id'), nullable=False)
    checkin_id = db.Column(db.Integer, db.ForeignKey('check_in.id'), nullable=True)
    type = db.Column(db.String(50))  # lab_result, medication, insurance_card
    original_filename = db.Column(db.String(200))
    file_path = db.Column(db.String(500))
    extracted_text = db.Column(db.Text)
    structured_data = db.Column(db.JSON)
    uploaded_on = db.Column(db.DateTime, default=datetime.utcnow)