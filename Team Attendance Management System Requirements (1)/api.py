from flask import Blueprint, render_template, redirect, url_for, request, flash, jsonify
from flask_login import login_required, current_user
from app.models.models import User, Attendance, db
from datetime import datetime, timedelta
import json
from werkzeug.security import generate_password_hash

api = Blueprint('api', __name__)

# API endpoint for user authentication
@api.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing username or password'}), 400
    
    # Authentication logic is handled in auth.py
    # This endpoint is for API documentation purposes
    
    return jsonify({'success': True, 'message': 'API endpoint for login'})

# API endpoint to get current user status
@api.route('/api/user/status', methods=['GET'])
@login_required
def user_status():
    return jsonify({
        'id': current_user.id,
        'username': current_user.username,
        'email': current_user.email,
        'is_admin': current_user.is_admin
    })

# API endpoint to record attendance check-in
@api.route('/api/attendance/check-in', methods=['POST'])
@login_required
def check_in():
    data = request.get_json()
    
    if not data or not data.get('latitude') or not data.get('longitude'):
        return jsonify({'success': False, 'message': 'Missing location data'}), 400
    
    # Check if user already has an open attendance record
    open_attendance = Attendance.query.filter_by(
        user_id=current_user.id, 
        check_out_time=None
    ).first()
    
    if open_attendance:
        return jsonify({'success': False, 'message': 'Already checked in'}), 400
    
    # Create new attendance record
    new_attendance = Attendance(
        user_id=current_user.id,
        check_in_time=datetime.utcnow(),
        notes=data.get('notes', '')
    )
    new_attendance.set_location(data.get('latitude'), data.get('longitude'))
    
    db.session.add(new_attendance)
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': 'Check-in successful',
        'attendance_id': new_attendance.id,
        'check_in_time': new_attendance.check_in_time.isoformat()
    })

# API endpoint to record attendance check-out
@api.route('/api/attendance/check-out', methods=['POST'])
@login_required
def check_out():
    # Find the user's open attendance record
    open_attendance = Attendance.query.filter_by(
        user_id=current_user.id, 
        check_out_time=None
    ).first()
    
    if not open_attendance:
        return jsonify({'success': False, 'message': 'No active check-in found'}), 400
    
    # Update the check-out time
    open_attendance.check_out_time = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': 'Check-out successful',
        'attendance_id': open_attendance.id,
        'check_in_time': open_attendance.check_in_time.isoformat(),
        'check_out_time': open_attendance.check_out_time.isoformat(),
        'duration': open_attendance.duration()
    })

# API endpoint to get attendance history
@api.route('/api/attendance/history', methods=['GET'])
@login_required
def attendance_history():
    # Get user's attendance records
    records = Attendance.query.filter_by(user_id=current_user.id).order_by(Attendance.check_in_time.desc()).all()
    
    history = []
    for record in records:
        location = record.get_location()
        history.append({
            'id': record.id,
            'check_in_time': record.check_in_time.isoformat(),
            'check_out_time': record.check_out_time.isoformat() if record.check_out_time else None,
            'duration': record.duration(),
            'location': location,
            'location_address': record.location_address,
            'notes': record.notes
        })
    
    return jsonify({'success': True, 'history': history})

# API endpoint for admin to get all attendance records
@api.route('/api/admin/attendance', methods=['GET'])
@login_required
def admin_attendance():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Admin privileges required'}), 403
    
    # Get query parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    user_id = request.args.get('user_id')
    
    # Build query
    query = Attendance.query
    
    if start_date:
        start_datetime = datetime.strptime(start_date, '%Y-%m-%d')
        query = query.filter(Attendance.check_in_time >= start_datetime)
    
    if end_date:
        end_datetime = datetime.strptime(end_date, '%Y-%m-%d')
        end_datetime = datetime.combine(end_datetime.date(), datetime.max.time())
        query = query.filter(Attendance.check_in_time <= end_datetime)
    
    if user_id and user_id != 'all':
        query = query.filter(Attendance.user_id == int(user_id))
    
    # Get records
    records = query.order_by(Attendance.check_in_time.desc()).all()
    
    # Format response
    attendance_data = []
    for record in records:
        user = User.query.get(record.user_id)
        location = record.get_location()
        
        attendance_data.append({
            'id': record.id,
            'user_id': record.user_id,
            'username': user.username,
            'check_in_time': record.check_in_time.isoformat(),
            'check_out_time': record.check_out_time.isoformat() if record.check_out_time else None,
            'duration': record.duration(),
            'location': location,
            'location_address': record.location_address,
            'notes': record.notes
        })
    
    return jsonify({'success': True, 'attendance': attendance_data})

# API endpoint for admin to get all users
@api.route('/api/admin/users', methods=['GET'])
@login_required
def admin_users():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Admin privileges required'}), 403
    
    users = User.query.all()
    users_data = []
    
    for user in users:
        users_data.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin,
            'created_at': user.created_at.isoformat()
        })
    
    return jsonify({'success': True, 'users': users_data})

# API endpoint for admin to create a new user
@api.route('/api/admin/users/create', methods=['POST'])
@login_required
def admin_create_user():
    if not current_user.is_admin:
        return jsonify({'success': False, 'message': 'Admin privileges required'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('email') or not data.get('password'):
        return jsonify({'success': False, 'message': 'Missing required fields'}), 400
    
    # Check if username or email already exists
    user_by_username = User.query.filter_by(username=data.get('username')).first()
    user_by_email = User.query.filter_by(email=data.get('email')).first()
    
    if user_by_username:
        return jsonify({'success': False, 'message': 'Username already exists'}), 400
    
    if user_by_email:
        return jsonify({'success': False, 'message': 'Email already exists'}), 400
    
    # Create new user
    new_user = User(
        username=data.get('username'),
        email=data.get('email'),
        password=generate_password_hash(data.get('password'), method='pbkdf2:sha256'),
        is_admin=data.get('is_admin', False)
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': 'User created successfully',
        'user': {
            'id': new_user.id,
            'username': new_user.username,
            'email': new_user.email,
            'is_admin': new_user.is_admin
        }
    })
