import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ShortcutModel } from '@/models/Shortcut';
import { DEFAULT_SHORTCUTS, Shortcut } from '@/lib/shortcutsData';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function getClientIdentifier(request: NextRequest): { clientId: string; userId?: string } {
  // Check auth token
  let userId: string | undefined;
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : request.cookies.get('falcon_token')?.value;

  if (token) {
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'falcon_super_secret_jwt_key_2026');
      if (decoded?.userId) {
        userId = decoded.userId;
      }
    } catch {
      // Ignore invalid token
    }
  }

  // Check header or cookie for client/device ID
  const headerClientId = request.headers.get('x-client-id');
  const cookieClientId = request.cookies.get('falcon_client_id')?.value;
  const clientId = userId || headerClientId || cookieClientId || 'default_user';

  return { clientId, userId };
}

// GET /api/shortcuts - Fetch user shortcuts or seed defaults
export async function GET(request: NextRequest) {
  try {
    const { clientId, userId } = getClientIdentifier(request);

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (err: any) {
      console.warn('[/api/shortcuts GET] DB connection offline:', err.message);
    }

    if (!dbConnected) {
      return NextResponse.json({
        success: true,
        shortcuts: DEFAULT_SHORTCUTS,
        dbStatus: 'offline',
      });
    }

    // Query existing shortcuts for this client/user
    const query = userId ? { $or: [{ userId }, { clientId }] } : { clientId };
    let docs = await ShortcutModel.find(query).sort({ order: 1, createdAt: 1 }).lean();

    // If none exist yet, seed with DEFAULT_SHORTCUTS in MongoDB
    if (!docs || docs.length === 0) {
      try {
        const seedData = DEFAULT_SHORTCUTS.map((s, index) => ({
          shortcutId: s.id,
          clientId,
          userId,
          title: s.title,
          url: s.url,
          color: s.color || '#1a73e8',
          order: index,
        }));
        await ShortcutModel.insertMany(seedData, { ordered: false });
        docs = await ShortcutModel.find(query).sort({ order: 1, createdAt: 1 }).lean();
      } catch (seedErr: any) {
        console.warn('[/api/shortcuts GET] Seed error:', seedErr.message);
      }
    }

    const formatted: Shortcut[] = docs.map((d: any) => ({
      id: d.shortcutId || d._id.toString(),
      title: d.title,
      url: d.url,
      color: d.color,
    }));

    const response = NextResponse.json({
      success: true,
      shortcuts: formatted.length > 0 ? formatted : DEFAULT_SHORTCUTS,
      dbStatus: 'connected',
    });

    // Set client cookie if not present
    if (!request.cookies.get('falcon_client_id')?.value && !userId) {
      response.cookies.set('falcon_client_id', clientId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax',
      });
    }

    return response;
  } catch (error: any) {
    console.error('[/api/shortcuts GET] Error:', error);
    return NextResponse.json({ success: true, shortcuts: DEFAULT_SHORTCUTS, error: error.message });
  }
}

// POST /api/shortcuts - Add new shortcut
export async function POST(request: NextRequest) {
  try {
    const { clientId, userId } = getClientIdentifier(request);
    const body = await request.json();
    const { title, url, color } = body;

    if (!title || !url) {
      return NextResponse.json({ success: false, error: 'Title and URL are required' }, { status: 400 });
    }

    const shortcutId = body.id || `sc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (err: any) {
      console.warn('[/api/shortcuts POST] DB offline:', err.message);
    }

    const newShortcut: Shortcut = {
      id: shortcutId,
      title: title.trim(),
      url: url.trim(),
      color: color || '#1a73e8',
    };

    if (dbConnected) {
      const count = await ShortcutModel.countDocuments({ clientId });
      await ShortcutModel.findOneAndUpdate(
        { clientId, shortcutId },
        {
          clientId,
          userId,
          shortcutId,
          title: newShortcut.title,
          url: newShortcut.url,
          color: newShortcut.color,
          order: count,
        },
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, shortcut: newShortcut, dbStatus: dbConnected ? 'connected' : 'offline' });
  } catch (error: any) {
    console.error('[/api/shortcuts POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT /api/shortcuts - Edit an existing shortcut
export async function PUT(request: NextRequest) {
  try {
    const { clientId } = getClientIdentifier(request);
    const body = await request.json();
    const { id, title, url, color } = body;

    if (!id || !title || !url) {
      return NextResponse.json({ success: false, error: 'id, title, and url are required' }, { status: 400 });
    }

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (err: any) {
      console.warn('[/api/shortcuts PUT] DB offline:', err.message);
    }

    if (dbConnected) {
      await ShortcutModel.findOneAndUpdate(
        { $or: [{ shortcutId: id }, { _id: id }], clientId },
        { $set: { title: title.trim(), url: url.trim(), color: color || '#1a73e8' } }
      );
    }

    return NextResponse.json({
      success: true,
      shortcut: { id, title: title.trim(), url: url.trim(), color },
      dbStatus: dbConnected ? 'connected' : 'offline',
    });
  } catch (error: any) {
    console.error('[/api/shortcuts PUT] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/shortcuts - Delete a shortcut
export async function DELETE(request: NextRequest) {
  try {
    const { clientId } = getClientIdentifier(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'id parameter is required' }, { status: 400 });
    }

    let dbConnected = false;
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (err: any) {
      console.warn('[/api/shortcuts DELETE] DB offline:', err.message);
    }

    if (dbConnected) {
      await ShortcutModel.deleteOne({
        clientId,
        $or: [{ shortcutId: id }, { _id: id }],
      });
    }

    return NextResponse.json({ success: true, deletedId: id, dbStatus: dbConnected ? 'connected' : 'offline' });
  } catch (error: any) {
    console.error('[/api/shortcuts DELETE] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
