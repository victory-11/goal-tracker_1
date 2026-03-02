import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateSyncCode, isValidSyncCode, formatSyncCode } from '@/lib/sync';
import { Prisma } from '@prisma/client';

// Create a new sync group
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, goals } = body; // goals is an optional array of goals to upload

    const code = generateSyncCode();

    // Create the sync group
    const syncGroup = await db.syncGroup.create({
      data: {
        code,
        name: name || null,
      },
    });

    // If goals are provided, upload them to the new sync group
    if (goals && Array.isArray(goals) && goals.length > 0) {
      // First, create all goals without parent relationships
      const goalMap = new Map<string, string>(); // old id -> new id
      
      for (const goal of goals) {
        const newGoal = await db.goal.create({
          data: {
            title: goal.title,
            description: goal.description || null,
            priority: goal.priority || 'MEDIUM',
            status: goal.status || 'PENDING',
            category: goal.category || 'PERSONAL',
            dueDate: goal.dueDate ? new Date(goal.dueDate) : null,
            notes: goal.notes || null,
            parentId: null, // Will update later
            syncGroupId: syncGroup.id,
            syncedAt: new Date(),
          },
        });
        goalMap.set(goal.id, newGoal.id);
      }

      // Now update parent relationships
      for (const goal of goals) {
        if (goal.parentId && goalMap.has(goal.parentId)) {
          await db.goal.update({
            where: { id: goalMap.get(goal.id)! },
            data: { parentId: goalMap.get(goal.parentId)! },
          });
        }
      }
    }

    // Fetch all goals for this sync group to return
    const syncGroupWithGoals = await db.syncGroup.findUnique({
      where: { id: syncGroup.id },
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

    return NextResponse.json({
      id: syncGroup.id,
      code: syncGroup.code,
      name: syncGroup.name,
      createdAt: syncGroup.createdAt,
      updatedAt: syncGroup.updatedAt,
      goals: syncGroupWithGoals?.goals || [],
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
          where: { parentId: null }, // Only root goals
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
