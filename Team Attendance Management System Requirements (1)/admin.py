from flask import Blueprint, render_template, redirect, url_for, request, flash, send_file
from flask_login import login_required, current_user
from app.models.models import User, Attendance, db
from datetime import datetime, timedelta
import csv
import os
import io
import tempfile
import json

admin = Blueprint('admin', __name__)

@admin.route('/admin')
@login_required
def index():
    # Check if user is admin
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.')
        return redirect(url_for('attendance.index'))
    
    # Get all users
    users = User.query.all()
    
    # Get recent attendance records
    recent_records = Attendance.query.order_by(Attendance.check_in_time.desc()).limit(10).all()
    
    return render_template('admin/index.html', users=users, recent_records=recent_records)

@admin.route('/admin/users')
@login_required
def users():
    # Check if user is admin
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.')
        return redirect(url_for('attendance.index'))
    
    # Get all users
    users = User.query.all()
    
    return render_template('admin/users.html', users=users)

@admin.route('/admin/users/<int:user_id>/toggle-admin', methods=['POST'])
@login_required
def toggle_admin(user_id):
    # Check if current user is admin
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.')
        return redirect(url_for('attendance.index'))
    
    # Get target user
    user = User.query.get_or_404(user_id)
    
    # Don't allow removing admin status from yourself
    if user.id == current_user.id:
        flash('Cannot remove admin status from yourself.')
        return redirect(url_for('admin.users'))
    
    # Toggle admin status
    user.is_admin = not user.is_admin
    db.session.commit()
    
    flash(f'Admin status for {user.username} has been {"granted" if user.is_admin else "revoked"}.')
    return redirect(url_for('admin.users'))

@admin.route('/admin/reports')
@login_required
def reports():
    # Check if user is admin
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.')
        return redirect(url_for('attendance.index'))
    
    # Get all users for filter dropdown
    users = User.query.all()
    
    # Get date range from query parameters
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    user_id = request.args.get('user_id')
    
    # Default to last 7 days if no dates provided
    today = datetime.utcnow().date()
    if not start_date_str:
        start_date = today - timedelta(days=7)
    else:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    
    if not end_date_str:
        end_date = today
    else:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    
    # Convert dates to datetime for query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    # Build query
    query = Attendance.query.filter(
        Attendance.check_in_time >= start_datetime,
        Attendance.check_in_time <= end_datetime
    )
    
    # Filter by user if specified
    if user_id and user_id != 'all':
        query = query.filter(Attendance.user_id == int(user_id))
    
    # Get records
    records = query.order_by(Attendance.check_in_time.desc()).all()
    
    return render_template(
        'admin/reports.html', 
        records=records, 
        users=users,
        start_date=start_date.strftime('%Y-%m-%d'),
        end_date=end_date.strftime('%Y-%m-%d'),
        selected_user_id=user_id
    )

@admin.route('/admin/export-csv')
@login_required
def export_csv():
    # Check if user is admin
    if not current_user.is_admin:
        flash('Access denied. Admin privileges required.')
        return redirect(url_for('attendance.index'))
    
    # Get date range from query parameters
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    user_id = request.args.get('user_id')
    
    # Default to last 30 days if no dates provided
    today = datetime.utcnow().date()
    if not start_date_str:
        start_date = today - timedelta(days=30)
    else:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
    
    if not end_date_str:
        end_date = today
    else:
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    
    # Convert dates to datetime for query
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    # Build query
    query = Attendance.query.filter(
        Attendance.check_in_time >= start_datetime,
        Attendance.check_in_time <= end_datetime
    )
    
    # Filter by user if specified
    if user_id and user_id != 'all':
        query = query.filter(Attendance.user_id == int(user_id))
    
    # Get records
    records = query.order_by(Attendance.check_in_time.desc()).all()
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Username', 'Check-in Time', 'Check-out Time', 'Duration (hours)',
        'Location (Lat, Long)', 'Address', 'Notes'
    ])
    
    # Write data
    for record in records:
        user = User.query.get(record.user_id)
        location = record.get_location()
        location_str = f"{location['latitude']}, {location['longitude']}" if location else "N/A"
        
        writer.writerow([
            record.id,
            user.username,
            record.check_in_time.strftime('%Y-%m-%d %H:%M:%S'),
            record.check_out_time.strftime('%Y-%m-%d %H:%M:%S') if record.check_out_time else 'N/A',
            record.duration() if record.duration() else 'N/A',
            location_str,
            record.location_address or 'N/A',
            record.notes or ''
        ])
    
    # Prepare response
    output.seek(0)
    filename = f"attendance_report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.csv"
    
    return send_file(
        io.BytesIO(output.getvalue().encode('utf-8')),
        mimetype='text/csv',
        as_attachment=True,
        download_name=filename
    )
