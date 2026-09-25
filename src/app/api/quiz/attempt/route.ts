import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QuizAttempt } from '@/models/QuizAttempt';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cycleKey, track, score, totalQuestions, accuracy, userAnswers } = body;

    if (!cycleKey || score === undefined || !totalQuestions) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (dbErr: any) {
      console.warn('[/api/quiz/attempt] MongoDB offline:', dbErr.message);
    }

    if (!dbConnected) {
      return NextResponse.json({
        success: true,
        savedLocally: true,
        message: 'Saved to local storage (MongoDB Atlas is currently offline or authenticating)',
      });
    }

    // Try to get user from JWT cookie
    let userId: string | undefined;
    let userName = 'Guest Scholar';
    let userEmail: string | undefined;

    const token = request.cookies.get('falcon_token')?.value;
    if (token) {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback');
        userId = decoded.userId;
        userName = decoded.name || 'User';
        userEmail = decoded.email;
      } catch { /* guest */ }
    }

    const attempt = await QuizAttempt.create({
      userId,
      userName,
      userEmail,
      cycleKey,
      track: track || 'all',
      score,
      totalQuestions,
      accuracy: accuracy || Math.round((score / totalQuestions) * 100),
      userAnswers: userAnswers || [],
    });

    return NextResponse.json({ success: true, attempt });
  } catch (error: any) {
    console.error('[/api/quiz/attempt] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
