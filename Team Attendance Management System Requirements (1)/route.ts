import { NextRequest, NextResponse } from "next/server";
import { login } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const remember = formData.get("remember") === "on";
  
  if (!username || !password) {
    return NextResponse.redirect(new URL("/login?error=Please provide username and password", request.url));
  }
  
  try {
    const user = await login(username, password);
    
    if (!user) {
      return NextResponse.redirect(new URL("/login?error=Invalid username or password", request.url));
    }
    
    // Set cookies
    const cookieStore = cookies();
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: "/",
    };
    
    cookieStore.set("userId", user.id.toString(), cookieOptions);
    cookieStore.set("isAdmin", user.is_admin ? "1" : "0", cookieOptions);
    
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.redirect(new URL("/login?error=An error occurred during login", request.url));
  }
}
