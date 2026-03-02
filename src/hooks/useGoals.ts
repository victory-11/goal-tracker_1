'use client';

import { useState, useCallback, useEffect } from 'react';
import { Goal, GoalInput, GoalUpdate, Status } from '@/types/goal';
import { 
  StoredSyncGroup, 
  getStoredSyncGroup, 
  setStoredSyncGroup,
} from '@/lib/sync';
import { useGoalsStore } from '@/store/goals';

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  syncGroup: StoredSyncGroup | null;
  pendingSync: boolean;
  isLocalMode: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (data: GoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, data: GoalUpdate) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  updateStatus: (id: string, status: Status) => Promise<Goal | null>;
  joinSyncGroup: (code: string) => Promise<boolean>;
  createSyncGroup: (name?: string) => Promise<StoredSyncGroup | null>;
  leaveSyncGroup: () => void;
  syncFromServer: () => Promise<void>;
  uploadLocalGoals: () => Promise<boolean>;
}

// Generate a unique ID for local goals
function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function useGoals(): UseGoalsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncGroup, setSyncGroup] = useState<StoredSyncGroup | null>(null);
  
  const { 
    goals, 
    setGoals, 
    addGoal, 
    updateGoal: updateGoalInStore, 
    removeGoal,
  } = useGoalsStore();

  // Determine if we're in local mode (no sync group)
  const isLocalMode = !syncGroup;

  // Initialize sync group from localStorage
  useEffect(() => {
    const stored = getStoredSyncGroup();
    if (stored) {
      setSyncGroup(stored);
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch goals from server (only when in sync group)
  const fetchGoals = useCallback(async () => {
    // In local mode, goals are already in Zustand store (persisted in localStorage)
    // No need to fetch from server
    if (!syncGroup) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/goals?syncGroupId=${syncGroup.id}`);
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [syncGroup, setGoals]);

  // Create a goal
  const createGoal = useCallback(async (data: GoalInput): Promise<Goal | null> => {
    // In local mode, just save to localStorage
    if (!syncGroup) {
      const localGoal: Goal = {
        id: generateLocalId(),
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'PENDING',
        category: data.category || 'PERSONAL',
        dueDate: data.dueDate || null,
        notes: data.notes || null,
        parentId: data.parentId || null,
        syncGroupId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedAt: null,
      };
      addGoal(localGoal);
      return localGoal;
    }

    // In sync mode, save to server
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          syncGroupId: syncGroup.id,
        }),
      });
      if (!response.ok) throw new Error('Failed to create goal');
      const newGoal = await response.json();
      addGoal(newGoal);
      return newGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [syncGroup, addGoal]);

  // Update a goal
  const updateGoal = useCallback(async (id: string, data: GoalUpdate): Promise<Goal | null> => {
    // In local mode, just update localStorage
    if (!syncGroup || id.startsWith('local_')) {
      updateGoalInStore(id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      return null;
    }

    // In sync mode, update on server
    try {
      const response = await fetch(`/api/goals/${id}?syncGroupId=${syncGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update goal');
      const updatedGoal = await response.json();
      updateGoalInStore(id, updatedGoal);
      return updatedGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [syncGroup, updateGoalInStore]);

  // Delete a goal
  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    // In local mode, just delete from localStorage
    if (!syncGroup || id.startsWith('local_')) {
      removeGoal(id);
      return true;
    }

    // In sync mode, delete from server
    try {
      const response = await fetch(`/api/goals/${id}?syncGroupId=${syncGroup.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete goal');
      removeGoal(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, [syncGroup, removeGoal]);

  // Update status helper
  const updateStatus = useCallback(async (id: string, status: Status): Promise<Goal | null> => {
    return updateGoal(id, { status });
  }, [updateGoal]);

  // Join an existing sync group
  const joinSyncGroup = useCallback(async (code: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/sync?code=${code}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join sync group');
      }
      
      const data = await response.json();
      const storedGroup: StoredSyncGroup = {
        id: data.id,
        code: data.code,
        name: data.name,
        joinedAt: new Date().toISOString(),
      };
      
      setSyncGroup(storedGroup);
      setStoredSyncGroup(storedGroup);
      
      // Replace local goals with server goals
      setGoals(data.goals || []);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, [setGoals]);

  // Create a new sync group and upload local goals
  const createSyncGroup = useCallback(async (name?: string): Promise<StoredSyncGroup | null> => {
    try {
      // Include local goals to upload
      const localGoals = goals.filter(g => !g.syncGroupId || g.id.startsWith('local_'));
      
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name,
          goals: localGoals, // Upload local goals
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create sync group');
      
      const data = await response.json();
      const storedGroup: StoredSyncGroup = {
        id: data.id,
        code: data.code,
        name: data.name,
        joinedAt: new Date().toISOString(),
      };
      
      setSyncGroup(storedGroup);
      setStoredSyncGroup(storedGroup);
      
      // Replace local goals with server goals (now with real IDs)
      setGoals(data.goals || []);
      
      return storedGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [goals, setGoals]);

  // Leave sync group
  const leaveSyncGroup = useCallback(() => {
    setSyncGroup(null);
    setStoredSyncGroup(null);
    // Clear goals when leaving sync group
    setGoals([]);
  }, [setGoals]);

  // Sync from server
  const syncFromServer = useCallback(async () => {
    if (syncGroup) {
      await fetchGoals();
    }
  }, [syncGroup, fetchGoals]);

  // Upload local goals to current sync group
  const uploadLocalGoals = useCallback(async (): Promise<boolean> => {
    if (!syncGroup) return false;
    
    const localGoals = goals.filter(g => g.id.startsWith('local_'));
    if (localGoals.length === 0) return true;
    
    try {
      // Upload each local goal
      for (const goal of localGoals) {
        await fetch('/api/goals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: goal.title,
            description: goal.description,
            priority: goal.priority,
            status: goal.status,
            category: goal.category,
            dueDate: goal.dueDate,
            notes: goal.notes,
            parentId: goal.parentId,
            syncGroupId: syncGroup.id,
          }),
        });
      }
      
      // Fetch updated goals from server
      await fetchGoals();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, [syncGroup, goals, fetchGoals]);

  // Fetch goals when sync group changes
  useEffect(() => {
    if (syncGroup) {
      fetchGoals();
    }
  }, [syncGroup, fetchGoals]);

  return {
    goals,
    loading,
    error,
    isOnline,
    syncGroup,
    pendingSync: false, // No longer needed with local-first approach
    isLocalMode,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateStatus,
    joinSyncGroup,
    createSyncGroup,
    leaveSyncGroup,
    syncFromServer,
    uploadLocalGoals,
  };
}
