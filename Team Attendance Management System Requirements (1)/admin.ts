import { getCloudflareContext } from '@/lib/cloudflare';
import { User } from './auth';

// Report type definitions
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  userId?: number;
}

export interface AttendanceReport {
  id: number;
  user_id: number;
  username: string;
  check_in_time: string;
  check_out_time: string | null;
  duration: number | null;
  location_data: string;
  location_address: string | null;
  notes: string | null;
}

// Get all users (admin function)
export async function getAllUsers(): Promise<User[]> {
  const { env } = getCloudflareContext();
  
  const users = await env.DB.prepare(
    'SELECT id, username, email, is_admin, created_at FROM users ORDER BY id'
  ).all();
  
  return users.results as User[];
}

// Get attendance reports with filters
export async function getAttendanceReports(filters: ReportFilters): Promise<AttendanceReport[]> {
  const { env } = getCloudflareContext();
  
  let query = `
    SELECT 
      a.id, 
      a.user_id, 
      u.username, 
      a.check_in_time, 
      a.check_out_time, 
      a.location_data, 
      a.location_address, 
      a.notes 
    FROM attendance a
    JOIN users u ON a.user_id = u.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (filters.startDate) {
    query += ' AND a.check_in_time >= ?';
    params.push(filters.startDate);
  }
  
  if (filters.endDate) {
    query += ' AND a.check_in_time <= ?';
    params.push(filters.endDate);
  }
  
  if (filters.userId && filters.userId !== 0) {
    query += ' AND a.user_id = ?';
    params.push(filters.userId);
  }
  
  query += ' ORDER BY a.check_in_time DESC';
  
  const stmt = env.DB.prepare(query);
  const bindStmt = params.length > 0 ? stmt.bind(...params) : stmt;
  const records = await bindStmt.all();
  
  // Calculate duration for each record
  const reports = records.results.map((record: any) => {
    let duration = null;
    if (record.check_out_time) {
      const checkIn = new Date(record.check_in_time);
      const checkOut = new Date(record.check_out_time);
      duration = parseFloat(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(2));
    }
    
    return {
      ...record,
      duration
    };
  });
  
  return reports as AttendanceReport[];
}

// Toggle admin status for a user
export async function toggleAdminStatus(userId: number): Promise<boolean> {
  const { env } = getCloudflareContext();
  
  // Get current admin status
  const user = await env.DB.prepare(
    'SELECT is_admin FROM users WHERE id = ?'
  ).bind(userId).first();
  
  if (!user) {
    return false;
  }
  
  // Toggle admin status
  const newStatus = user.is_admin ? 0 : 1;
  
  const result = await env.DB.prepare(
    'UPDATE users SET is_admin = ? WHERE id = ?'
  ).bind(newStatus, userId).run();
  
  return result.success;
}

// Add new user (admin function)
export async function addUser(username: string, email: string, password: string, isAdmin: boolean): Promise<User | null> {
  const { env } = getCloudflareContext();
  
  // Check if username or email already exists
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).bind(username, email).first();
  
  if (existingUser) {
    return null;
  }
  
  // Hash the password
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Insert the new user
  const result = await env.DB.prepare(
    'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)'
  ).bind(username, email, hashedPassword, isAdmin ? 1 : 0).run();
  
  if (!result.success) {
    return null;
  }
  
  // Get the newly created user
  const newUser = await env.DB.prepare(
    'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?'
  ).bind(result.meta.last_row_id).first();
  
  return newUser as User;
}
