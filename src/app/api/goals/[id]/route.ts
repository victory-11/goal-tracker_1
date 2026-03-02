import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET single goal - Only if it belongs to user's sync group
export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const syncGroupId = searchParams.get('syncGroupId');

    const goal = await db.goal.findUnique({
      where: { id },
      include: {
        subGoals: {
          include: {
            subGoals: true,
          },
        },
        parent: true,
        syncGroup: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Privacy: Only return goal if it belongs to the user's sync group
    // Or if it's a local goal (no syncGroupId) and user is not asking for sync group
    if (syncGroupId && goal.syncGroupId !== syncGroupId) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT update goal - Only if it belongs to user's sync group
export async function PUT(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, priority, status, category, dueDate, notes, parentId, syncGroupId } = body;

    const existingGoal = await db.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Privacy: Only allow update if goal belongs to user's sync group
    if (syncGroupId && existingGoal.syncGroupId !== syncGroupId) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Prevent setting parentId to self
    if (parentId === id) {
      return NextResponse.json(
        { error: 'A goal cannot be its own parent' },
        { status: 400 }
      );
    }

    const goal = await db.goal.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingGoal.title,
        description: description !== undefined ? description : existingGoal.description,
        priority: priority || existingGoal.priority,
        status: status || existingGoal.status,
        category: category || existingGoal.category,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingGoal.dueDate,
        notes: notes !== undefined ? notes : existingGoal.notes,
        parentId: parentId !== undefined ? parentId : existingGoal.parentId,
        syncedAt: new Date(),
      },
      include: {
        subGoals: true,
        syncGroup: true,
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE goal - Only if it belongs to user's sync group
export async function DELETE(
  request: Request,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const syncGroupId = searchParams.get('syncGroupId');
    
    const existingGoal = await db.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    // Privacy: Only allow delete if goal belongs to user's sync group
    if (syncGroupId && existingGoal.syncGroupId !== syncGroupId) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    await db.goal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Goal not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
