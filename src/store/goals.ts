import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Goal } from '@/types/goal';
import { StoredSyncGroup } from '@/lib/sync';

interface GoalsState {
  // Goals state
  goals: Goal[];
  loading: boolean;
  error: string | null;
  
  // Sync group state
  syncGroup: StoredSyncGroup | null;
  
  // Offline state
  isOnline: boolean;
  pendingSync: boolean;
  lastSyncAt: string | null;
  
  // Actions
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Sync actions
  setSyncGroup: (group: StoredSyncGroup | null) => void;
  setOnline: (online: boolean) => void;
  setPendingSync: (pending: boolean) => void;
  setLastSyncAt: (time: string | null) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  goals: [],
  loading: false,
  error: null,
  syncGroup: null,
  isOnline: true,
  pendingSync: false,
  lastSyncAt: null,
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setGoals: (goals) => set({ goals }),
      addGoal: (goal) => set((state) => ({ 
        goals: [...state.goals, goal],
        pendingSync: false,
        lastSyncAt: new Date().toISOString(),
      })),
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map((g) => 
          g.id === id ? { ...g, ...updates } : g
        ),
        pendingSync: false,
        lastSyncAt: new Date().toISOString(),
      })),
      removeGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
        pendingSync: false,
        lastSyncAt: new Date().toISOString(),
      })),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      setSyncGroup: (syncGroup) => set({ syncGroup }),
      setOnline: (isOnline) => set({ isOnline }),
      setPendingSync: (pendingSync) => set({ pendingSync }),
      setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      
      reset: () => set(initialState),
    }),
    {
      name: 'goal-tracker-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        goals: state.goals,
        syncGroup: state.syncGroup,
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
