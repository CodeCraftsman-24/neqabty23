import unittest
from app import create_app
from app.models.models import db, User, Attendance
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta
import json

class AttendanceSystemTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Create test users
            admin_user = User(
                username='admin',
                email='admin@example.com',
                password=generate_password_hash('password'),
                is_admin=True
            )
            
            regular_user = User(
                username='user',
                email='user@example.com',
                password=generate_password_hash('password'),
                is_admin=False
            )
            
            db.session.add(admin_user)
            db.session.add(regular_user)
            db.session.commit()
            
            # Create test attendance records
            attendance1 = Attendance(
                user_id=2,  # regular_user
                check_in_time=datetime.utcnow() - timedelta(hours=8),
                check_out_time=datetime.utcnow() - timedelta(hours=4),
                notes='Test attendance'
            )
            attendance1.set_location(37.7749, -122.4194)
            
            attendance2 = Attendance(
                user_id=2,  # regular_user
                check_in_time=datetime.utcnow() - timedelta(days=1, hours=8),
                check_out_time=datetime.utcnow() - timedelta(days=1, hours=4),
                notes='Previous day attendance'
            )
            attendance2.set_location(37.7749, -122.4194)
            
            db.session.add(attendance1)
            db.session.add(attendance2)
            db.session.commit()
    
    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_login(self):
        # Test login with valid credentials
        response = self.client.post('/login', data={
            'username': 'user',
            'password': 'password'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Home', response.data)
        
        # Test login with invalid credentials
        response = self.client.post('/login', data={
            'username': 'user',
            'password': 'wrong_password'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Please check your login details', response.data)
    
    def test_register(self):
        # Test registration with new user
        response = self.client.post('/register', data={
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'password'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Login', response.data)
        
        # Test registration with existing username
        response = self.client.post('/register', data={
            'username': 'user',
            'email': 'different@example.com',
            'password': 'password'
        }, follow_redirects=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Username already exists', response.data)
    
    def test_attendance_api(self):
        # Login as regular user
        self.client.post('/login', data={
            'username': 'user',
            'password': 'password'
        })
        
        # Test check-in API
        response = self.client.post('/api/attendance/check-in', 
            json={
                'latitude': 37.7749,
                'longitude': -122.4194,
                'notes': 'API test check-in'
            }
        )
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Test attendance status API
        response = self.client.get('/api/attendance/status')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'checked_in')
        
        # Test check-out API
        response = self.client.post('/api/attendance/check-out')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        
        # Test attendance history API
        response = self.client.get('/api/attendance/history')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertTrue(data['success'])
        self.assertEqual(len(data['history']), 3)  # 2 from setup + 1 from test
    
    def test_admin_access(self):
        # Login as admin
        self.client.post('/login', data={
            'username': 'admin',
            'password': 'password'
        })
        
        # Test admin dashboard access
        response = self.client.get('/admin')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Admin Dashboard', response.data)
        
        # Test admin users page
        response = self.client.get('/admin/users')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'User Management', response.data)
        
        # Test admin reports page
        response = self.client.get('/admin/reports')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Attendance Reports', response.data)
        
        # Login as regular user
        self.client.get('/logout')
        self.client.post('/login', data={
            'username': 'user',
            'password': 'password'
        })
        
        # Test admin access restriction for regular users
        # First logout
        self.client.get('/logout')
        # Then login as regular user
        self.client.post('/login', data={
            'username': 'user',
            'password': 'password'
        })
        # Try to access admin page
        response = self.client.get('/admin', follow_redirects=True)
        # Should be redirected to index page
        self.assertNotIn(b'Admin Dashboard', response.data)

if __name__ == '__main__':
    unittest.main()
