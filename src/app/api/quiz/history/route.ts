import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { QuizAttempt } from '@/models/QuizAttempt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (dbErr: any) {
      console.warn('[/api/quiz/history] MongoDB offline:', dbErr.message);
    }

    if (!dbConnected) {
      return NextResponse.json({ success: true, history: [], dbStatus: 'offline' });
    }

    // Return the most recent 30 attempts (newest first)
    const history = await QuizAttempt.find({})
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, history, dbStatus: 'connected' });
  } catch (error: any) {
    console.error('[/api/quiz/history] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
