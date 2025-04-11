import { getCloudflareContext } from '@/lib/cloudflare';

// Attendance type definition
export interface Attendance {
  id: number;
  user_id: number;
  check_in_time: string;
  check_out_time: string | null;
  location_data: string;
  location_address: string | null;
  notes: string | null;
}

// Location type definition
export interface Location {
  latitude: number;
  longitude: number;
}

// Check in function
export async function checkIn(userId: number, location: Location, notes?: string): Promise<Attendance | null> {
  const { env } = getCloudflareContext();
  
  // Check if user already has an open attendance record
  const openAttendance = await env.DB.prepare(
    'SELECT id FROM attendance WHERE user_id = ? AND check_out_time IS NULL'
  ).bind(userId).first();
  
  if (openAttendance) {
    return null; // Already checked in
  }
  
  // Store location as JSON string
  const locationData = JSON.stringify(location);
  
  // Insert new attendance record
  const result = await env.DB.prepare(
    'INSERT INTO attendance (user_id, location_data, notes) VALUES (?, ?, ?)'
  ).bind(userId, locationData, notes || null).run();
  
  if (!result.success) {
    return null;
  }
  
  // Get the newly created attendance record
  const newAttendance = await env.DB.prepare(
    'SELECT id, user_id, check_in_time, check_out_time, location_data, location_address, notes FROM attendance WHERE id = ?'
  ).bind(result.meta.last_row_id).first();
  
  return newAttendance as Attendance;
}

// Check out function
export async function checkOut(userId: number): Promise<Attendance | null> {
  const { env } = getCloudflareContext();
  
  // Find the user's open attendance record
  const openAttendance = await env.DB.prepare(
    'SELECT id FROM attendance WHERE user_id = ? AND check_out_time IS NULL'
  ).bind(userId).first();
  
  if (!openAttendance) {
    return null; // No active check-in
  }
  
  // Update the check-out time
  const result = await env.DB.prepare(
    'UPDATE attendance SET check_out_time = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(openAttendance.id).run();
  
  if (!result.success) {
    return null;
  }
  
  // Get the updated attendance record
  const updatedAttendance = await env.DB.prepare(
    'SELECT id, user_id, check_in_time, check_out_time, location_data, location_address, notes FROM attendance WHERE id = ?'
  ).bind(openAttendance.id).first();
  
  return updatedAttendance as Attendance;
}

// Get attendance status
export async function getAttendanceStatus(userId: number): Promise<{ status: 'checked_in' | 'checked_out', attendance?: Attendance }> {
  const { env } = getCloudflareContext();
  
  // Find the user's open attendance record
  const openAttendance = await env.DB.prepare(
    'SELECT id, user_id, check_in_time, check_out_time, location_data, location_address, notes FROM attendance WHERE user_id = ? AND check_out_time IS NULL'
  ).bind(userId).first();
  
  if (!openAttendance) {
    return { status: 'checked_out' };
  }
  
  return { 
    status: 'checked_in',
    attendance: openAttendance as Attendance
  };
}

// Get attendance history
export async function getAttendanceHistory(userId: number, limit = 50): Promise<Attendance[]> {
  const { env } = getCloudflareContext();
  
  // Get user's attendance records
  const records = await env.DB.prepare(
    'SELECT id, user_id, check_in_time, check_out_time, location_data, location_address, notes FROM attendance WHERE user_id = ? ORDER BY check_in_time DESC LIMIT ?'
  ).bind(userId, limit).all();
  
  return records.results as Attendance[];
}

// Calculate duration in hours
export function calculateDuration(checkInTime: string, checkOutTime: string | null): number | null {
  if (!checkOutTime) {
    return null;
  }
  
  const checkIn = new Date(checkInTime);
  const checkOut = new Date(checkOutTime);
  const durationMs = checkOut.getTime() - checkIn.getTime();
  
  return parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));
}

// Parse location data
export function parseLocationData(locationData: string): Location | null {
  try {
    return JSON.parse(locationData) as Location;
  } catch (error) {
    return null;
  }
}
