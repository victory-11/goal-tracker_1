import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Goal } from '@/types/goal';
import { StoredSyncGroup } from '@/lib/sync';

interface GoalsState {
  // Goals state (persisted to localStorage)
  goals: Goal[];
  
  // Sync group state (persisted to localStorage)
  syncGroup: StoredSyncGroup | null;
  
  // Last sync time (persisted to localStorage)
  lastSyncAt: string | null;
  
  // Actions
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  
  // Sync actions
  setSyncGroup: (group: StoredSyncGroup | null) => void;
  setLastSyncAt: (time: string | null) => void;
  
  // Reset
  reset: () => void;
}

const initialState = {
  goals: [],
  syncGroup: null,
  lastSyncAt: null,
};

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      ...initialState,
      
      setGoals: (goals) => set({ goals }),
      
      addGoal: (goal) => set((state) => ({ 
        goals: [...state.goals, goal],
      })),
      
      updateGoal: (id, updates) => set((state) => ({
        goals: state.goals.map((g) => 
          g.id === id ? { ...g, ...updates } : g
        ),
      })),
      
      removeGoal: (id) => set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      })),
      
      setSyncGroup: (syncGroup) => set({ syncGroup }),
      
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
