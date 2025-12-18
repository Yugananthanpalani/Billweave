import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { createUserIfNotExists, updateUserLastLogin, getUserByEmail, isAdmin } from '../lib/firestore';
import { User as AppUser } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  isAdminUser: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, shopName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user?.email) {
        try {
          // Create user if doesn't exist
          await createUserIfNotExists(user.email);
          
          // Get app user data
          const userData = await getUserByEmail(user.email);
          setAppUser(userData);
          setIsAdminUser(isAdmin(user.email));
          
          // Update last login
          await updateUserLastLogin(user.email);
          
          // Check if user is blocked
          if (userData?.isBlocked) {
            await firebaseSignOut(auth);
            alert('Your account has been blocked. Please contact the administrator.');
            return;
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setAppUser(null);
        setIsAdminUser(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Check if user exists and is not blocked before signing in
      const userData = await getUserByEmail(email);
      if (userData?.isBlocked) {
        throw new Error('Your account has been blocked. Please contact the administrator.');
      }
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, shopName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Create user with shop name
      await createUserIfNotExists(userCredential.user.email!, shopName);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setAppUser(null);
      setIsAdminUser(false);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    appUser,
    isAdminUser,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
