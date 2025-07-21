
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User 
} from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth, database } from '@/lib/firebase';
import { ref, remove as firebaseRemove, set as firebaseSet } from 'firebase/database';


interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, pass: string, displayName: string) => Promise<any>;
  signIn: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserName: (displayName: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  deleteUserAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  updateUserName: async () => {},
  updateUserPassword: async () => {},
  reauthenticate: async () => {},
  deleteUserAccount: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user && pathname === '/login') {
        router.replace('/');
      } else if (!user && pathname !== '/login') {
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  const signUp = async (email: string, pass: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const createdUser = userCredential.user;
    if (createdUser) {
      await updateProfile(createdUser, { displayName });
      
      const userProfileRef = ref(database, `users/${createdUser.uid}/profile`);
      await firebaseSet(userProfileRef, {
        name: displayName,
        email: email
      });

      setUser({ ...createdUser, displayName });
    }
    return userCredential;
  };

  const signIn = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signOut = () => {
    return firebaseSignOut(auth);
  };

  const updateUserName = async (displayName: string) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });

      const userProfileRef = ref(database, `users/${auth.currentUser.uid}/profile/name`);
      await firebaseSet(userProfileRef, displayName);

      setUser({ ...auth.currentUser, displayName });
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await reauthenticate(currentPassword);
        await updatePassword(currentUser, newPassword);
      } catch (error: any) {
         if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect current password. Please try again.');
        }
        throw new Error('Failed to update password. ' + error.message);
      }
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  const reauthenticate = async (password: string) => {
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.email) {
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
    } else {
      throw new Error("User not found or email not available for re-authentication.");
    }
  };

  const deleteUserAccount = async (password: string) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await reauthenticate(password);
        
        const userDbRef = ref(database, `users/${currentUser.uid}`);
        await firebaseRemove(userDbRef);

        await deleteUser(currentUser);
      } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
            throw new Error('Incorrect password. Please try again.');
        }
        throw new Error('Failed to delete account. ' + error.message);
      }
    } else {
      throw new Error("No user is currently signed in.");
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateUserName,
    updateUserPassword,
    reauthenticate,
    deleteUserAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
