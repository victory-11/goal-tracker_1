'use client';

import { useState, useCallback, useEffect } from 'react';
import { Goal, GoalInput, GoalUpdate, Status } from '@/types/goal';
import { 
  StoredSyncGroup, 
  getStoredSyncGroup, 
  setStoredSyncGroup,
  getOfflineQueue,
  addToOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
} from '@/lib/sync';
import { useGoalsStore } from '@/store/goals';

interface UseGoalsReturn {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  syncGroup: StoredSyncGroup | null;
  pendingSync: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (data: GoalInput) => Promise<Goal | null>;
  updateGoal: (id: string, data: GoalUpdate) => Promise<Goal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  updateStatus: (id: string, status: Status) => Promise<Goal | null>;
  joinSyncGroup: (code: string) => Promise<boolean>;
  createSyncGroup: (name?: string) => Promise<StoredSyncGroup | null>;
  leaveSyncGroup: () => void;
  syncFromServer: () => Promise<void>;
}

export function useGoals(): UseGoalsReturn {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncGroup, setSyncGroup] = useState<StoredSyncGroup | null>(null);
  const [pendingSync, setPendingSync] = useState(false);
  
  const { 
    goals, 
    setGoals, 
    addGoal, 
    updateGoal: updateGoalInStore, 
    removeGoal,
  } = useGoalsStore();

  // Initialize sync group from localStorage
  useEffect(() => {
    const stored = getStoredSyncGroup();
    if (stored) {
      setSyncGroup(stored);
    }
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Process offline queue when back online
      processOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process offline queue when back online
  const processOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setPendingSync(true);

    for (const item of queue) {
      try {
        if (item.action === 'create') {
          const response = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          });
          if (response.ok) {
            removeFromOfflineQueue(item.id);
          }
        } else if (item.action === 'update') {
          const response = await fetch(`/api/goals/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data),
          });
          if (response.ok) {
            removeFromOfflineQueue(item.id);
          }
        } else if (item.action === 'delete') {
          const response = await fetch(`/api/goals/${item.id}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            removeFromOfflineQueue(item.id);
          }
        }
      } catch (err) {
        console.error('Failed to sync offline item:', err);
      }
    }

    setPendingSync(false);
    clearOfflineQueue();
  }, []);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = syncGroup 
        ? `/api/goals?syncGroupId=${syncGroup.id}` 
        : '/api/goals';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch goals');
      const data = await response.json();
      setGoals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [syncGroup, setGoals]);

  const createGoal = useCallback(async (data: GoalInput): Promise<Goal | null> => {
    const goalData = {
      ...data,
      syncGroupId: syncGroup?.id || null,
    };

    if (!isOnline) {
      // Offline: store locally and queue for sync
      const tempId = `temp_${Date.now()}`;
      const tempGoal: Goal = {
        id: tempId,
        title: data.title,
        description: data.description || null,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'PENDING',
        category: data.category || 'PERSONAL',
        dueDate: data.dueDate || null,
        notes: data.notes || null,
        parentId: data.parentId || null,
        syncGroupId: syncGroup?.id || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncedAt: null,
      };
      
      addGoal(tempGoal);
      addToOfflineQueue({
        id: tempId,
        action: 'create',
        data: goalData,
        timestamp: Date.now(),
      });
      setPendingSync(true);
      return tempGoal;
    }

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });
      if (!response.ok) throw new Error('Failed to create goal');
      const newGoal = await response.json();
      addGoal(newGoal);
      return newGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [syncGroup, isOnline, addGoal]);

  const updateGoal = useCallback(async (id: string, data: GoalUpdate): Promise<Goal | null> => {
    if (!isOnline) {
      // Offline: update locally and queue for sync
      updateGoalInStore(id, data);
      addToOfflineQueue({
        id,
        action: 'update',
        data: { ...data, syncGroupId: syncGroup?.id },
        timestamp: Date.now(),
      });
      setPendingSync(true);
      return null;
    }

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, syncGroupId: syncGroup?.id }),
      });
      if (!response.ok) throw new Error('Failed to update goal');
      const updatedGoal = await response.json();
      updateGoalInStore(id, updatedGoal);
      return updatedGoal;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, [syncGroup, isOnline, updateGoalInStore]);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    if (!isOnline) {
      // Offline: delete locally and queue for sync
      removeGoal(id);
      addToOfflineQueue({
        id,
        action: 'delete',
        data: {},
        timestamp: Date.now(),
      });
      setPendingSync(true);
      return true;
    }

    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete goal');
      removeGoal(id);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, [isOnline, removeGoal]);

  const updateStatus = useCallback(async (id: string, status: Status): Promise<Goal | null> => {
    return updateGoal(id, { status });
  }, [updateGoal]);

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
      setGoals(data.goals || []);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  }, [setGoals]);

  const createSyncGroup = useCallback(async (name?: string): Promise<StoredSyncGroup | null> => {
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
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
      
      return storedGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    }
  }, []);

  const leaveSyncGroup = useCallback(() => {
    setSyncGroup(null);
    setStoredSyncGroup(null);
    clearOfflineQueue();
    setGoals([]);
  }, [setGoals]);

  const syncFromServer = useCallback(async () => {
    if (syncGroup) {
      await fetchGoals();
    }
  }, [syncGroup, fetchGoals]);

  // Fetch goals on mount or when sync group changes
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    isOnline,
    syncGroup,
    pendingSync,
    fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal,
    updateStatus,
    joinSyncGroup,
    createSyncGroup,
    leaveSyncGroup,
    syncFromServer,
  };
}
