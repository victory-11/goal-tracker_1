import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// GET goals - ONLY returns goals for a specific sync group
// Without syncGroupId, returns empty array (goals are local-only)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syncGroupId = searchParams.get('syncGroupId');
    
    // Privacy: Only return goals if syncGroupId is provided
    // Without syncGroupId, goals should be local-only (not in database)
    if (!syncGroupId) {
      return NextResponse.json([]);
    }

    // Verify the sync group exists
    const syncGroup = await db.syncGroup.findUnique({
      where: { id: syncGroupId },
    });

    if (!syncGroup) {
      return NextResponse.json([]);
    }

    const goals = await db.goal.findMany({
      where: {
        syncGroupId: syncGroupId, // Only goals for this sync group
      },
      include: {
        subGoals: {
          include: {
            subGoals: true,
          },
        },
        syncGroup: true,
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST create goal - ONLY stores in database if syncGroupId is provided
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, status, category, dueDate, notes, parentId, syncGroupId } = body;

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Privacy: Only store in database if syncGroupId is provided
    // Without syncGroupId, the goal should be stored locally only (handled by frontend)
    if (!syncGroupId) {
      return NextResponse.json(
        { error: 'syncGroupId is required. Goals without sync group should be stored locally.' },
        { status: 400 }
      );
    }

    // Verify the sync group exists
    const syncGroup = await db.syncGroup.findUnique({
      where: { id: syncGroupId },
    });

    if (!syncGroup) {
      return NextResponse.json(
        { error: 'Sync group not found' },
        { status: 404 }
      );
    }

    const goal = await db.goal.create({
      data: {
        title,
        description: description || null,
        priority: priority || 'MEDIUM',
        status: status || 'PENDING',
        category: category || 'PERSONAL',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        parentId: parentId || null,
        syncGroupId: syncGroupId,
        syncedAt: new Date(),
      },
      include: {
        subGoals: true,
        syncGroup: true,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Parent goal or sync group not found' },
          { status: 400 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
