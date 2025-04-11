-- Migration number: 0001 	 2025-04-11
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS attendance;

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table for tracking check-ins and check-outs
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  check_in_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  check_out_time DATETIME,
  location_data TEXT NOT NULL, -- JSON string with lat/long
  location_address TEXT,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_check_in_time ON attendance(check_in_time);
CREATE INDEX idx_users_username ON users(username);

-- Insert admin user for initial setup (password is hashed 'admin123')
INSERT INTO users (username, email, password, is_admin) VALUES 
  ('admin', 'admin@example.com', '$2a$10$JwXdZRQxQmH1wxM9VYZ7S.MQ5ZSIJCMgVRJNGMJvJOu.VnT5fBjiC', 1);
