import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  userProfile: any | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used inside of a FirebaseProvider');
  }
  return context;
};

import { loginWithGoogle, logoutUser } from '../lib/firebase';

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  useEffect(() => {
    // Listen to real-time session changes from Google Auth state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userDocPath = `users/${currentUser.uid}`;
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            // New user registration flow
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || 'Developer',
              createdAt: new Date().toISOString()
            };
            
            // Core Schema Constraint validation write
            try {
              await setDoc(docRef, newProfile);
              setUserProfile(newProfile);
            } catch (writeErr) {
              handleFirestoreError(writeErr, OperationType.WRITE, userDocPath);
            }
          }
        } catch (readErr) {
          handleFirestoreError(readErr, OperationType.GET, userDocPath);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError("Sign-in cancelled: Google popup was closed by user.");
        console.warn("Sign-in cancelled: Google popup closed.");
      } else {
        setAuthError("Sign-in failed. Please ensure cookies are allowed and try again.");
        console.error('Google Sign In authentication error:', err);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        loading,
        userProfile,
        signIn: handleSignIn,
        signOut: handleSignOut,
        authError,
        clearAuthError
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};
