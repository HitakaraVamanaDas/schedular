
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, remove as firebaseRemove } from 'firebase/database';
import { database } from '@/lib/firebase';
import { useAuth } from './use-auth';

type ToneType = 'notification' | 'alarm';
type Tones = {
  [key in ToneType]?: string; // Base64 encoded audio string
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export function useTones() {
  const { user } = useAuth();
  const [tones, setTones] = useState<Tones>({});
  const [loading, setLoading] = useState(true);
  const userId = user?.uid;

  useEffect(() => {
    if (!userId || !database) {
      setLoading(false);
      if (!userId) setTones({});
      return;
    }
    
    setLoading(true);
    const tonesRef = ref(database, `users/${userId}/tones`);
    
    const unsubscribe = onValue(tonesRef, (snapshot) => {
      const data = snapshot.val();
      setTones(data || {});
      setLoading(false);
    }, (error) => {
      console.error("Firebase read failed for tones: " + error.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const uploadTone = useCallback(async (toneType: ToneType, file: File) => {
    if (!userId || !database) {
      throw new Error('No user is signed in or database is not available.');
    }
    if (file.size > 1024 * 1024) { // 1MB limit for safety
        throw new Error('File is too large. Please select a file smaller than 1MB.');
    }
    const base64String = await fileToBase64(file);
    try {
      const toneRef = ref(database, `users/${userId}/tones/${toneType}`);
      await set(toneRef, base64String);
    } catch (error) {
      console.error('Failed to upload tone to Firebase', error);
      throw new Error('Failed to upload tone.');
    }
  }, [userId]);

  const deleteTone = useCallback(async (toneType: ToneType) => {
    if (!userId || !database) {
      throw new Error('No user is signed in or database is not available.');
    }
    try {
      const toneRef = ref(database, `users/${userId}/tones/${toneType}`);
      await firebaseRemove(toneRef);
    } catch (error) {
      console.error('Failed to delete tone from Firebase', error);
      throw new Error('Failed to delete tone.');
    }
  }, [userId]);

  return { tones, uploadTone, deleteTone, loading };
}
