import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSyncCode, isValidSyncCode, formatSyncCode } from '@/lib/sync';

// Create a new sync group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    const code = generateSyncCode();

    const syncGroup = await db.syncGroup.create({
      data: {
        code,
        name: name || null,
      },
    });

    return NextResponse.json({
      id: syncGroup.id,
      code: syncGroup.code,
      name: syncGroup.name,
      createdAt: syncGroup.createdAt,
      updatedAt: syncGroup.updatedAt,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating sync group:', error);
    return NextResponse.json(
      { error: 'Failed to create sync group' },
      { status: 500 }
    );
  }
}

// Join an existing sync group by code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Sync code is required' },
        { status: 400 }
      );
    }

    const formattedCode = formatSyncCode(code);

    if (!isValidSyncCode(formattedCode)) {
      return NextResponse.json(
        { error: 'Invalid sync code format. Must be 6 characters (A-Z, 0-9)' },
        { status: 400 }
      );
    }

    const syncGroup = await db.syncGroup.findUnique({
      where: { code: formattedCode },
      include: {
        goals: {
          include: {
            subGoals: {
              include: {
                subGoals: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!syncGroup) {
      return NextResponse.json(
        { error: 'Sync group not found. Check your code and try again.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: syncGroup.id,
      code: syncGroup.code,
      name: syncGroup.name,
      createdAt: syncGroup.createdAt,
      updatedAt: syncGroup.updatedAt,
      goals: syncGroup.goals,
    });
  } catch (error) {
    console.error('Error fetching sync group:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync group' },
      { status: 500 }
    );
  }
}
