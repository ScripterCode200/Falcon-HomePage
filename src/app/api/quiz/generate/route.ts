import { NextRequest, NextResponse } from 'next/server';
import { generateSasQuizWithGemini } from '@/lib/geminiQuizService';
import { SAS_TRACKS } from '@/lib/sasKnowledgeBase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const track = (searchParams.get('track') as any) || 'all';
    const difficulty = (searchParams.get('difficulty') as any) || 'Medium';
    const count = parseInt(searchParams.get('count') || '5', 10);

    const result = await generateSasQuizWithGemini({
      track,
      difficulty,
      count,
    });

    return NextResponse.json({
      success: true,
      questions: result.questions,
      source: result.source,
      model: result.modelUsed,
      trackInfo: SAS_TRACKS[track] || SAS_TRACKS.all,
    });
  } catch (error: any) {
    console.error('Quiz generation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate quiz',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const track = body.track || 'all';
    const difficulty = body.difficulty || 'Medium';
    const count = body.count || 5;

    const result = await generateSasQuizWithGemini({
      track,
      difficulty,
      count,
    });

    return NextResponse.json({
      success: true,
      questions: result.questions,
      source: result.source,
      model: result.modelUsed,
      trackInfo: SAS_TRACKS[track] || SAS_TRACKS.all,
    });
  } catch (error: any) {
    console.error('Quiz generation API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate quiz',
      },
      { status: 500 }
    );
  }
}
