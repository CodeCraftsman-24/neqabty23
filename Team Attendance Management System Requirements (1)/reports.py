import os
import tempfile
from flask import Blueprint, render_template, redirect, url_for, request, flash, send_file
from flask_login import login_required, current_user
from app.models.models import User, Attendance, db
from datetime import datetime, timedelta
import csv
import io
import json
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

reports = Blueprint('reports', __name__)

@reports.route('/admin/export-pdf')
@login_required
def export_pdf():
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
        user_name = User.query.get(int(user_id)).username
        report_title = f"Attendance Report for {user_name}"
    else:
        report_title = "Attendance Report for All Users"
    
    # Get records
    records = query.order_by(Attendance.check_in_time.desc()).all()
    
    # Create PDF in memory
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    elements = []
    
    # Add title
    styles = getSampleStyleSheet()
    elements.append(Paragraph(report_title, styles['Title']))
    elements.append(Paragraph(f"Period: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}", styles['Normal']))
    elements.append(Spacer(1, 12))
    
    # Create table data
    data = [
        ['ID', 'Username', 'Check-in Time', 'Check-out Time', 'Duration (hours)', 'Location', 'Notes']
    ]
    
    # Add records to table
    for record in records:
        user = User.query.get(record.user_id)
        location = record.get_location()
        location_str = f"{location['latitude']}, {location['longitude']}" if location else "N/A"
        if record.location_address:
            location_str = record.location_address
        
        data.append([
            str(record.id),
            user.username,
            record.check_in_time.strftime('%Y-%m-%d %H:%M:%S'),
            record.check_out_time.strftime('%Y-%m-%d %H:%M:%S') if record.check_out_time else 'N/A',
            str(record.duration()) if record.duration() else 'N/A',
            location_str,
            record.notes or ''
        ])
    
    # Create the table
    table = Table(data)
    
    # Add style to the table
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ])
    
    table.setStyle(style)
    elements.append(table)
    
    # Add summary information
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Total Records: {len(records)}", styles['Normal']))
    
    # Calculate total hours
    total_hours = sum(record.duration() or 0 for record in records)
    elements.append(Paragraph(f"Total Hours: {total_hours:.2f}", styles['Normal']))
    
    # Build the PDF
    doc.build(elements)
    
    # Prepare response
    buffer.seek(0)
    filename = f"attendance_report_{start_date.strftime('%Y%m%d')}_to_{end_date.strftime('%Y%m%d')}.pdf"
    
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=filename
    )
