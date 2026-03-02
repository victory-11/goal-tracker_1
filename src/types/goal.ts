export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type Status = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type Category = 'WORK' | 'HEALTH' | 'LEARNING' | 'PERSONAL' | 'FINANCE' | 'OTHER';

export interface SyncGroup {
  id: string;
  code: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  category: Category;
  dueDate: string | null;
  notes: string | null;
  parentId: string | null;
  subGoals?: Goal[];
  syncGroupId: string | null;
  syncGroup?: SyncGroup;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
}

export interface GoalInput {
  title: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  category?: Category;
  dueDate?: string | null;
  notes?: string;
  parentId?: string | null;
  syncGroupId?: string | null;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  category?: Category;
  dueDate?: string | null;
  notes?: string;
  parentId?: string | null;
  syncGroupId?: string | null;
}

export interface GoalGroup extends Goal {
  subGoals: Goal[];
  progress: number;
}

export const PRIORITY_COLORS: Record<Priority, string> = {
  HIGH: 'text-red-500 bg-red-50 dark:bg-red-950 dark:text-red-400',
  MEDIUM: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
  LOW: 'text-green-500 bg-green-50 dark:bg-green-950 dark:text-green-400',
};

export const PRIORITY_BORDER_COLORS: Record<Priority, string> = {
  HIGH: 'border-l-red-500',
  MEDIUM: 'border-l-yellow-500',
  LOW: 'border-l-green-500',
};

export const STATUS_COLORS: Record<Status, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

export const CATEGORY_COLORS: Record<Category, string> = {
  WORK: 'bg-blue-500',
  HEALTH: 'bg-rose-500',
  LEARNING: 'bg-purple-500',
  PERSONAL: 'bg-orange-500',
  FINANCE: 'bg-emerald-500',
  OTHER: 'bg-gray-500',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  WORK: 'Work',
  HEALTH: 'Health',
  LEARNING: 'Learning',
  PERSONAL: 'Personal',
  FINANCE: 'Finance',
  OTHER: 'Other',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

export const STATUS_LABELS: Record<Status, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};
