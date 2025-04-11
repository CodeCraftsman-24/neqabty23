import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@/lib/cloudflare';

// This file provides the Cloudflare context for database access
// It's used by the auth, attendance, and admin libraries

export function getCloudflareContext() {
  // @ts-ignore - Cloudflare bindings are injected at runtime
  const env = process.env.NODE_ENV === 'development' ? { DB: null } : globalThis.process.env;
  
  // Check if DB is available
  if (!env.DB) {
    console.warn('Database is not configured. Please enable it in wrangler.toml');
  }
  
  return { env };
}

// Helper function to get client IP address
export function getClientIP(req: NextRequest): string {
  // Try to get IP from Cloudflare headers
  const cfConnectingIP = req.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to forwarded-for header
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // Final fallback
  return '0.0.0.0';
}

// Helper function to log access
export async function logAccess(req: NextRequest): Promise<void> {
  const { env } = getCloudflareContext();
  
  if (!env.DB) {
    return;
  }
  
  const ip = getClientIP(req);
  const path = req.nextUrl.pathname;
  
  try {
    await env.DB.prepare(
      'INSERT INTO access_logs (ip, path) VALUES (?, ?)'
    ).bind(ip, path).run();
  } catch (error) {
    console.error('Failed to log access:', error);
  }
}
