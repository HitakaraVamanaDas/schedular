
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, remove as firebaseRemove, update as firebaseUpdate } from 'firebase/database';
import type { Label } from '@/lib/types';
import { database } from '@/lib/firebase';
import { useAuth } from './use-auth';

const DEFAULT_LABELS: Omit<Label, 'id'>[] = [
    { name: 'Work', color: '#3B82F6' },
    { name: 'Personal', color: '#22C55E' },
    { name: 'Urgent', color: '#EF4444' },
];

export function useLabels() {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.uid;

  useEffect(() => {
    if (!userId || !database) {
      setLoading(false);
      if (!userId) setLabels([]);
      return;
    }
    
    setLoading(true);
    const labelsRef = ref(database, `users/${userId}/labels`);
    
    const unsubscribe = onValue(labelsRef, (snapshot) => {
      const data = snapshot.val();

      if (data === null) {
        // No labels exist, so create the default ones
        const defaultLabelsWithIds: { [key: string]: Omit<Label, 'id'> } = {};
        const updates: { [key: string]: Omit<Label, 'id'> } = {};
        
        DEFAULT_LABELS.forEach(label => {
            const newLabelRef = push(labelsRef);
            if (newLabelRef.key) {
                updates[newLabelRef.key] = label;
            }
        });
        
        set(labelsRef, updates).then(() => {
            const labelsArray = Object.entries(updates).map(([id, value]) => ({ id, ...value }));
            setLabels(labelsArray);
            setLoading(false);
        });
      } else {
        const labelsArray: Label[] = Object.entries(data).map(([id, value]) => ({
            id,
            ...(value as Omit<Label, 'id'>),
          }));
        setLabels(labelsArray);
        setLoading(false);
      }
    }, (error) => {
      console.error("Firebase read for labels failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addLabel = useCallback(async (newLabel: Omit<Label, 'id'>) => {
    if (!userId || !database) {
      throw new Error('No user signed in or database unavailable.');
    }
    const labelsRef = ref(database, `users/${userId}/labels`);
    const newLabelRef = push(labelsRef);
    await set(newLabelRef, newLabel);
    return newLabelRef.key;
  }, [userId]);

  const deleteLabel = useCallback(async (labelId: string) => {
    if (!userId || !database) {
        throw new Error('No user signed in or database unavailable.');
    }
    const labelRef = ref(database, `users/${userId}/labels/${labelId}`);
    await firebaseRemove(labelRef);

    // Also remove this labelId from all events that use it
    const eventsRef = ref(database, `users/${userId}/events`);
    onValue(eventsRef, (snapshot) => {
      const events = snapshot.val();
      if (events) {
        const updates: {[key: string]: any} = {};
        Object.entries(events).forEach(([eventId, eventData]: [string, any]) => {
          if (eventData.labelIds?.includes(labelId)) {
            const newLabelIds = eventData.labelIds.filter((id: string) => id !== labelId);
            updates[`/users/${userId}/events/${eventId}/labelIds`] = newLabelIds.length > 0 ? newLabelIds : null;
          }
        });
        if(Object.keys(updates).length > 0) {
            firebaseUpdate(ref(database), updates);
        }
      }
    }, { onlyOnce: true });


  }, [userId]);

  const updateLabel = useCallback(async (updatedLabel: Label) => {
     if (!userId || !database) {
        throw new Error('No user signed in or database unavailable.');
    }
    const { id, ...labelData } = updatedLabel;
    const labelRef = ref(database, `users/${userId}/labels/${id}`);
    await set(labelRef, labelData);
  }, [userId]);

  const getLabelById = useCallback((id: string) => {
    return labels.find(label => label.id === id);
  }, [labels]);

  return { labels, addLabel, deleteLabel, updateLabel, getLabelById, loading };
}
