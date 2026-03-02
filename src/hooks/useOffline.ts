'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  syncStatus: 'synced' | 'pending' | 'offline';
}

export function useOffline(): UseOfflineReturn {
  // Use lazy initializer to get initial online status
  const [isOnline, setIsOnline] = useState(() => {
    // Check if we're in browser environment
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getSyncStatus = useCallback((): 'synced' | 'pending' | 'offline' => {
    if (!isOnline) return 'offline';
    // In a real app, you'd check if there are pending operations in IndexedDB
    return 'synced';
  }, [isOnline]);

  return {
    isOnline,
    isOffline: !isOnline,
    syncStatus: getSyncStatus(),
  };
}
