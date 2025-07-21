
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, remove as firebaseRemove, update } from 'firebase/database';
import type { Event } from '@/lib/types';
import { database } from '@/lib/firebase';
import { useAuth } from './use-auth';

// Helper function to remove undefined properties from an object
const cleanupObject = (obj: any) => {
  const newObj: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
};

export function useEvents() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = user?.uid;

  useEffect(() => {
    if (!userId || !database) {
      setLoading(false);
      // if there's no user, we clear the events
      if (!userId) setEvents([]);
      return;
    }
    
    setLoading(true);
    const eventsRef = ref(database, `users/${userId}/events`);
    
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const eventsArray: Event[] = data
        ? Object.entries(data).map(([id, value]) => ({
            id,
            ...(value as Omit<Event, 'id'>),
          }))
        : [];
      setEvents(eventsArray);
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addEvent = useCallback(async (newEvent: Omit<Event, 'id'>) => {
    if (!userId || !database) {
      console.error('No user is signed in or database is not available to add an event.');
      return;
    }
    try {
      const eventsRef = ref(database, `users/${userId}/events`);
      const newEventRef = push(eventsRef);
      // Clean up undefined values before setting
      await set(newEventRef, cleanupObject(newEvent));
    } catch (error) {
      console.error('Failed to add event to Firebase', error);
    }
  }, [userId]);

  const deleteEvent = useCallback(async (eventId: string) => {
     if (!userId || !database) {
      console.error('No user is signed in or database is not available to delete an event.');
      return;
    }
    try {
      const eventRef = ref(database, `users/${userId}/events/${eventId}`);
      await firebaseRemove(eventRef);
    } catch (error) {
      console.error('Failed to delete event from Firebase', error);
    }
  }, [userId]);
  
  const deleteAllCompletedEvents = useCallback(async () => {
    if (!userId || !database) {
      console.error('No user is signed in or database is not available to delete events.');
      return;
    }
    try {
      const completedEventIds = events.filter(e => e.isCompleted).map(e => e.id);
      if(completedEventIds.length === 0) return;

      const updates: { [key: string]: null } = {};
      completedEventIds.forEach(id => {
        updates[`/users/${userId}/events/${id}`] = null;
      });

      const eventsRef = ref(database);
      await update(eventsRef, updates);
    } catch (error) {
      console.error('Failed to delete completed events from Firebase', error);
    }
  }, [userId, events]);

  const updateEvent = useCallback(async (updatedEvent: Event) => {
     if (!userId || !database) {
      console.error('No user is signed in or database is not available to update an event.');
      return;
    }
    try {
      const { id, ...eventData } = updatedEvent;
      const eventRef = ref(database, `users/${userId}/events/${id}`);
      // Clean up undefined values before setting
      await set(eventRef, cleanupObject(eventData));
    } catch (error) {
      console.error('Failed to update event in Firebase', error);
    }
  }, [userId]);

  return { events, addEvent, deleteEvent, updateEvent, deleteAllCompletedEvents, loading };
}
