import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// User type definition
export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

// Authentication functions
export async function login(username: string, password: string): Promise<User | null> {
  const { env } = getCloudflareContext();
  
  // Query the user by username
  const stmt = env.DB.prepare(
    'SELECT id, username, email, password, is_admin, created_at FROM users WHERE username = ?'
  ).bind(username);
  
  const user = await stmt.first();
  
  if (!user) {
    return null;
  }
  
  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password);
  
  if (!passwordMatch) {
    return null;
  }
  
  // Don't return the password
  const { password: _, ...userWithoutPassword } = user;
  
  return userWithoutPassword as User;
}

export async function register(username: string, email: string, password: string): Promise<User | null> {
  const { env } = getCloudflareContext();
  
  // Check if username or email already exists
  const existingUser = await env.DB.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?'
  ).bind(username, email).first();
  
  if (existingUser) {
    return null;
  }
  
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Determine if this is the first user (will be admin)
  const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
  const isAdmin = userCount.count === 0 ? 1 : 0;
  
  // Insert the new user
  const result = await env.DB.prepare(
    'INSERT INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)'
  ).bind(username, email, hashedPassword, isAdmin).run();
  
  if (!result.success) {
    return null;
  }
  
  // Get the newly created user
  const newUser = await env.DB.prepare(
    'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?'
  ).bind(result.meta.last_row_id).first();
  
  return newUser as User;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    return null;
  }
  
  const { env } = getCloudflareContext();
  
  const user = await env.DB.prepare(
    'SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?'
  ).bind(parseInt(userId)).first();
  
  return user as User || null;
}

export function requireAuth() {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  
  if (!userId) {
    redirect('/login');
  }
  
  return userId;
}

export function requireAdmin() {
  const cookieStore = cookies();
  const userId = cookieStore.get('userId')?.value;
  const isAdmin = cookieStore.get('isAdmin')?.value;
  
  if (!userId || isAdmin !== '1') {
    redirect('/');
  }
  
  return userId;
}

export function logout() {
  const cookieStore = cookies();
  cookieStore.delete('userId');
  cookieStore.delete('isAdmin');
  redirect('/login');
}
