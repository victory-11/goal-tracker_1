import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const syncGroupId = searchParams.get('syncGroupId');
    
    const where: Prisma.GoalWhereInput = {};
    if (syncGroupId) {
      where.syncGroupId = syncGroupId;
    }

    const goals = await db.goal.findMany({
      where,
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
        syncGroupId: syncGroupId || null,
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
