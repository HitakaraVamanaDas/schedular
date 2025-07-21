
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from './use-auth';

const DEFAULT_ORDER = ['all', 'daily', 'weekly', 'monthly', 'yearly', "b'day / Anniversary", 'completed'];

export function usePageOrder() {
  const { user } = useAuth();
  const [pageOrder, setPageOrderState] = useState<string[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);
  const userId = user?.uid;

  useEffect(() => {
    if (!userId || !database) {
      setLoading(false);
      // if there's no user, reset to default
      if (!userId) setPageOrderState(DEFAULT_ORDER);
      return;
    }
    
    setLoading(true);
    const pageOrderRef = ref(database, `users/${userId}/pageOrder`);
    
    const unsubscribe = onValue(pageOrderRef, (snapshot) => {
      const storedOrder = snapshot.val();
      if (storedOrder) {
        const storedSet = new Set(storedOrder);
        const defaultSet = new Set(DEFAULT_ORDER);
         if (storedSet.size === defaultSet.size && [...storedSet].every(item => defaultSet.has(item))) {
          setPageOrderState(storedOrder);
        } else {
          // If the stored order is outdated (e.g., missing 'completed'), reset it.
          setPageOrderState(DEFAULT_ORDER);
          set(pageOrderRef, DEFAULT_ORDER);
        }
      } else {
        setPageOrderState(DEFAULT_ORDER);
        set(pageOrderRef, DEFAULT_ORDER); // Set default order if none exists in DB
      }
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const setPageOrder = useCallback((newOrder: string[]) => {
    if (!userId || !database) {
        console.error('No user is signed in or database is not available to set page order.');
        return;
    }
    try {
      const pageOrderRef = ref(database, `users/${userId}/pageOrder`);
      set(pageOrderRef, newOrder);
      // The onValue listener will update the state
    } catch (error) {
      console.error('Failed to save page order to Firebase', error);
    }
  }, [userId]);

  return { pageOrder, setPageOrder, loading };
}
