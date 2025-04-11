from flask import Flask
from flask_login import LoginManager
from app.models.models import db, User

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your-secret-key'  # Change this in production
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///attendance.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Setup login manager
    login_manager = LoginManager()
    login_manager.login_view = 'auth.login'
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Register blueprints
    from app.controllers.auth import auth as auth_blueprint
    app.register_blueprint(auth_blueprint)
    
    from app.controllers.attendance import attendance as attendance_blueprint
    app.register_blueprint(attendance_blueprint)
    
    from app.controllers.admin import admin as admin_blueprint
    app.register_blueprint(admin_blueprint)
    
    from app.controllers.api import api as api_blueprint
    app.register_blueprint(api_blueprint)
    
    from app.controllers.reports import reports as reports_blueprint
    app.register_blueprint(reports_blueprint)
    
    return app
