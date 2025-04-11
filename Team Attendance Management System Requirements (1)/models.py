from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
import json

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationship with attendance records
    attendance_records = db.relationship('Attendance', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'


class Attendance(db.Model):
    __tablename__ = 'attendance'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    check_in_time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    check_out_time = db.Column(db.DateTime, nullable=True)
    location_data = db.Column(db.Text, nullable=False)  # JSON string with lat/long
    location_address = db.Column(db.String(255), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    def set_location(self, latitude, longitude):
        """Store location data as JSON string"""
        self.location_data = json.dumps({
            'latitude': latitude,
            'longitude': longitude
        })
    
    def get_location(self):
        """Retrieve location data from JSON string"""
        if self.location_data:
            return json.loads(self.location_data)
        return None
    
    def duration(self):
        """Calculate duration of attendance in hours"""
        if self.check_out_time:
            delta = self.check_out_time - self.check_in_time
            return round(delta.total_seconds() / 3600, 2)
        return None
    
    def __repr__(self):
        return f'<Attendance {self.id} for User {self.user_id}>'
