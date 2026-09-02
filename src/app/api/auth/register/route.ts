import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { DEFAULT_SHORTCUTS } from '@/lib/shortcutsData';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, shortcuts, quizStats } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Please provide name, email, and password.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      shortcuts: Array.isArray(shortcuts) && shortcuts.length > 0 ? shortcuts : DEFAULT_SHORTCUTS,
      quizStats: quizStats || {
        currentStreak: 0,
        highestStreak: 0,
        totalQuizzesPlayed: 0,
        totalCorrectAnswers: 0,
        totalQuestionsAnswered: 0,
        lastPlayedDate: '',
        history: {},
      },
    });

    // Create 1-year JWT token
    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        shortcuts: newUser.shortcuts,
        quizStats: newUser.quizStats,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error occurred.' },
      { status: 500 }
    );
  }
}
