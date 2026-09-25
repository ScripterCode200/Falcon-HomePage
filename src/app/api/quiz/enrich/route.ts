import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { DailyQuiz } from '@/models/DailyQuiz';
import { getCurrentCycleKey } from '@/lib/quizData';
import { memoryCache } from '@/lib/quizCache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cycleKey = searchParams.get('cycleKey') || getCurrentCycleKey();

    // 1. Check in-memory cache first
    if (memoryCache[cycleKey]) {
      const questions = memoryCache[cycleKey].questions || [];
      const enrichedCount = questions.filter(
        (q: any) => q?.learningNode?.comprehensiveNote?.overview
      ).length;

      return NextResponse.json({
        success: true,
        questions,
        enrichedCount,
        totalQuestions: questions.length,
        isEnriching: memoryCache[cycleKey].isEnriching || false,
      });
    }

    // 2. Fallback to DB
    await connectToDatabase();
    const quiz = await DailyQuiz.findOne({ cycleKey }).lean();
    if (!quiz || !quiz.questions) {
      return NextResponse.json({ success: false, message: 'Quiz not found' }, { status: 404 });
    }

    const questions = quiz.questions;
    const enrichedCount = questions.filter(
      (q: any) => q?.learningNode?.comprehensiveNote?.overview
    ).length;

    return NextResponse.json({
      success: true,
      questions,
      enrichedCount,
      totalQuestions: questions.length,
      isEnriching: enrichedCount < questions.length,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
