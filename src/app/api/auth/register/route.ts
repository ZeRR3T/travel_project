import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { sendVerificationCode } from '@/lib/email';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user with verification code
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false, // Boolean type from updated schema
        verificationToken: verificationCode, // Store code in verificationToken field
        tokenExpiry: codeExpiry,
      },
    });

    // Send verification code email
    try {
      await sendVerificationCode({
        email: user.email,
        code: verificationCode,
        name: user.name || undefined, // Handle null case
      });
    } catch (emailError) {
      console.error('Failed to send verification code:', emailError);
      // Don't fail registration if email fails, but log it
    }

    // Return success with user ID for verification page
    return NextResponse.json(
      { 
        message: 'User registered successfully. Please check your email for verification code.',
        userId: user.id,
        email: user.email
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
