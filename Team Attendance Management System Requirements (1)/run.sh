#!/bin/bash

# Team Attendance Management System - Startup Script

# Activate virtual environment
source venv/bin/activate

# Run the Flask application
flask --app "app:create_app()" run --host=0.0.0.0 --port=5000
