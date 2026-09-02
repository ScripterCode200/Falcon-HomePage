import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authorization token required.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session token.' },
        { status: 401 }
      );
    }

    const { shortcuts, quizStats } = await req.json();

    await connectToDatabase();

    const updateFields: Record<string, any> = {};
    if (shortcuts) updateFields.shortcuts = shortcuts;
    if (quizStats) updateFields.quizStats = quizStats;

    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'User not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data synced successfully to cloud.',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        shortcuts: updatedUser.shortcuts,
        quizStats: updatedUser.quizStats,
      },
    });
  } catch (error: any) {
    console.error('Data synchronization error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error.' },
      { status: 500 }
    );
  }
}
