from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_required, current_user
from app.models.models import Attendance, db
from datetime import datetime
import json
from geopy.geocoders import Nominatim

attendance = Blueprint('attendance', __name__)

@attendance.route('/')
@login_required
def index():
    return render_template('index.html')

@attendance.route('/check-in', methods=['POST'])
@login_required
def check_in():
    latitude = request.form.get('latitude')
    longitude = request.form.get('longitude')
    notes = request.form.get('notes', '')
    
    if not latitude or not longitude:
        flash('Location data is required')
        return redirect(url_for('attendance.index'))
    
    # Check if user already has an open attendance record
    open_attendance = Attendance.query.filter_by(
        user_id=current_user.id, 
        check_out_time=None
    ).first()
    
    if open_attendance:
        flash('You already have an active check-in')
        return redirect(url_for('attendance.index'))
    
    # Try to get address from coordinates
    address = None
    try:
        geolocator = Nominatim(user_agent="attendance_system")
        location = geolocator.reverse(f"{latitude}, {longitude}")
        if location:
            address = location.address
    except Exception as e:
        # Just log the error, but continue with check-in
        print(f"Error getting address: {e}")
    
    # Create new attendance record
    new_attendance = Attendance(
        user_id=current_user.id,
        check_in_time=datetime.utcnow(),
        notes=notes,
        location_address=address
    )
    new_attendance.set_location(latitude, longitude)
    
    db.session.add(new_attendance)
    db.session.commit()
    
    flash('Check-in successful')
    return redirect(url_for('attendance.index'))

@attendance.route('/check-out', methods=['POST'])
@login_required
def check_out():
    # Find the user's open attendance record
    open_attendance = Attendance.query.filter_by(
        user_id=current_user.id, 
        check_out_time=None
    ).first()
    
    if not open_attendance:
        flash('No active check-in found')
        return redirect(url_for('attendance.index'))
    
    # Update the check-out time
    open_attendance.check_out_time = datetime.utcnow()
    db.session.commit()
    
    flash('Check-out successful')
    return redirect(url_for('attendance.index'))

@attendance.route('/history')
@login_required
def history():
    # Get user's attendance records
    records = Attendance.query.filter_by(user_id=current_user.id).order_by(Attendance.check_in_time.desc()).all()
    return render_template('history.html', records=records)

@attendance.route('/api/attendance/status')
@login_required
def status():
    # Check if user has an open attendance record
    open_attendance = Attendance.query.filter_by(
        user_id=current_user.id, 
        check_out_time=None
    ).first()
    
    if open_attendance:
        return jsonify({
            'status': 'checked_in',
            'check_in_time': open_attendance.check_in_time.isoformat(),
            'location': open_attendance.get_location(),
            'location_address': open_attendance.location_address
        })
    
    return jsonify({'status': 'checked_out'})
