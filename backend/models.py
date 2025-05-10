from app import db
from datetime import datetime

class Lifestyle(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    exercise = db.Column(db.String(200), nullable=False)
    diet = db.Column(db.String(200), nullable=False)
    sleep = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'age': self.age,
            'exercise': self.exercise,
            'diet': self.diet,
            'sleep': self.sleep,
            'created_at': self.created_at.isoformat()
        } 