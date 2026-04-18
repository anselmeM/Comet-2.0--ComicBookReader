import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(req: Request) {
  try {
    // 1. Rate limiting (T-AUTH-003)
    // In a real production app with a proxy, you'd use x-forwarded-for
    const ip = (req.headers.get('x-forwarded-for') || '127.0.0.1').split(',')[0];
    const limiter = await rateLimit(`reg_${ip}`, 5, 60 * 60 * 1000); // 5 per hour

    if (limiter.isLimited) {
      return NextResponse.json(
        { message: 'Too many registration attempts. Please try again in an hour.' },
        { status: 429, headers: limiter.headers }
      );
    }

    const body = await req.json();
    const { email: rawEmail, password } = registerSchema.parse(body);
    const email = rawEmail.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the new user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        hasCompletedOnboarding: true, // Default to true to avoid redirection issues
      },
      select: {
        id: true,
        email: true,
        plan: true,
      },
    });

    return NextResponse.json(
      { message: 'User created successfully', user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input', errors: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
