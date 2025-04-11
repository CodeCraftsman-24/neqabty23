# Team Attendance Management System - Deployment Guide

## Overview
This document provides instructions for deploying and using the Team Attendance Management System, a web-based application for tracking employee attendance with location data.

## System Requirements
- Python 3.10 or higher
- SQLite (included with Python)
- Modern web browser with JavaScript and geolocation support

## Installation

### 1. Clone or download the repository
```bash
git clone <repository-url>
cd attendance_system
```

### 2. Create and activate a virtual environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Initialize the database
```bash
flask --app "app:create_app()" shell
```
This will create the SQLite database file automatically.

## Running the Application

### Development Server
```bash
flask --app "app:create_app()" run --host=0.0.0.0 --port=5000
```

### Production Deployment
For production deployment, it's recommended to use a WSGI server like Gunicorn:

```bash
pip install gunicorn
gunicorn "app:create_app()" --bind 0.0.0.0:5000
```

## First-Time Setup

1. Access the application at http://localhost:5000
2. Register the first user, who will automatically be assigned admin privileges
3. Use the admin account to add additional users

## Features

### User Authentication
- Secure login and registration
- Role-based access control (admin vs. regular users)

### Attendance Tracking
- Check-in with geolocation data
- Check-out functionality
- Notes for each attendance record

### Admin Features
- User management (view, add, promote/demote admin)
- Comprehensive attendance reports
- Export reports to CSV and PDF formats

### Reporting
- Filter reports by date range and user
- Export attendance data for analysis
- Summary statistics

## Security Considerations

- Change the SECRET_KEY in app/__init__.py before deploying to production
- Use HTTPS in production to protect user data and geolocation information
- Regularly backup the SQLite database file

## Troubleshooting

### Location Services
- Ensure browser permissions for location services are enabled
- For mobile devices, ensure location services are enabled at the system level

### Database Issues
If you encounter database errors, you can reset the database:
```bash
rm -f instance/attendance.db
flask --app "app:create_app()" shell
```

## Support
For additional support or feature requests, please contact the system administrator.
