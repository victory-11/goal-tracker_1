import { customAlphabet } from 'nanoid';

// Generate a 6-character sync code using uppercase letters and numbers
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 6);

export function generateSyncCode(): string {
  return nanoid();
}

export function isValidSyncCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

export function formatSyncCode(code: string): string {
  return code.toUpperCase();
}

// Local storage keys
export const SYNC_GROUP_KEY = 'goal_tracker_sync_group';

export interface StoredSyncGroup {
  id: string;
  code: string;
  name: string | null;
  joinedAt: string;
}

export function getStoredSyncGroup(): StoredSyncGroup | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(SYNC_GROUP_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function setStoredSyncGroup(group: StoredSyncGroup | null): void {
  if (typeof window === 'undefined') return;
  if (group) {
    localStorage.setItem(SYNC_GROUP_KEY, JSON.stringify(group));
  } else {
    localStorage.removeItem(SYNC_GROUP_KEY);
  }
}
