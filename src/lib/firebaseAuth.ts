
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { UserSchema, CompanySchema, PendingInviteSchema } from './schemas';

// Firebase configuration - In production, these should be environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth helper functions
export interface AuthResult {
  success: boolean;
  user?: User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?: string; }; // Enhance User type
  error?: string;
}

export interface UserSettings {
  legalAlerts: boolean;
  newTrackAlerts: boolean;
  digestFrequency: 'daily' | 'weekly' | 'off';
}

// Helper function to convert username to email format
const normalizeEmailInput = (input: string): string => {
  // If input doesn't contain @, treat it as username and append domain
  if (!input.includes('@')) {
    return `${input}@witventure.com`;
  }
  return input;
};

export const signInUser = async (emailOrUsername: string, password: string): Promise<AuthResult> => {
  const email = normalizeEmailInput(emailOrUsername);

  // Development mode: Mock authentication for demo user
  if (process.env.NODE_ENV === 'development') {
    if (emailOrUsername === DEMO_USER.username || email === DEMO_USER.email) {
      if (password === DEMO_USER.password) {
        // Create a mock user object for development
        const mockUser = {
          uid: 'demo-user-123',
          email: DEMO_USER.email,
          displayName: 'HR Test User',
          emailVerified: true,
          subscriptionTier: 'premium', // Assign a default premium tier for demo
          companyId: 'desaria-group-123', // Assign a default company for demo
          role: 'Admin',
        } as User & { subscriptionTier: 'premium'; companyId: string; role: string };

        // Store in localStorage for persistence
        localStorage.setItem('mockAuthUser', JSON.stringify(mockUser));

        // Trigger a custom event to notify auth state change
        window.dispatchEvent(new Event('storage'));

        return {
          success: true,
          user: mockUser
        };
      } else {
        return {
          success: false,
          error: 'Incorrect password. Please try again.'
        };
      }
    } else {
      return {
        success: false,
        error: 'No account found with this username.'
      };
    }
  }

  // Production mode: Use Firebase Auth
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Fetch user details from Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    let userData: (User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?: string; });

    if (userDocSnap.exists()) {
      userData = { ...user, ...userDocSnap.data() as { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?: string; } };
    } else {
      // If user document doesn't exist, create it with a default free tier
      // In a real invite-only system, this flow would be more controlled (e.g., via Cloud Functions)
      const defaultUserData = {
        uid: user.uid,
        email: user.email,
        subscriptionTier: 'free',
        role: 'User',
        // companyId would be set during invite acceptance or initial company setup
      };
      await setDoc(userDocRef, defaultUserData);
      userData = { ...user, ...defaultUserData };
    }

    return {
      success: true,
      user: userData
    };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getAuthErrorMessage(authError.code)
    };
  }
};

export const signOutUser = async (): Promise<AuthResult> => {
  // Development mode: Clear mock user
  if (process.env.NODE_ENV === 'development') {
    localStorage.removeItem('mockAuthUser');
    // Trigger a custom event to notify auth state change
    window.dispatchEvent(new Event('storage'));
    return { success: true };
  }

  // Production mode: Use Firebase Auth
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    const authError = error as AuthError;
    return {
      success: false,
      error: getAuthErrorMessage(authError.code)
    };
  }
};

export const onAuthStateChange = (callback: (user: (User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?:string }) | null) => void) => {
  // Development mode: Mock auth state change
  if (process.env.NODE_ENV === 'development') {
    // Initial call with current user
    const currentUser = getCurrentUser();
    callback(currentUser);

    // Listen for localStorage changes (for logout)
    const handleStorageChange = () => {
      const mockUser = getCurrentUser();
      callback(mockUser);
    };

    window.addEventListener('storage', handleStorageChange);

    // Return cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }

  // Production mode: Use Firebase Auth
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        callback({ ...user, ...userDocSnap.data() as { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?:string } });
      } else {
        callback(user as (User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?:string })); // Return basic user if no doc exists
      }
    } else {
      callback(null);
    }
  });
};

// Helper function to convert Firebase auth error codes to user-friendly messages
const getAuthErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials.';
    default:
      return 'An error occurred during sign in. Please try again.';
  }
};

// Check if user is authenticated
export const getCurrentUser = (): (User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?:string }) | null => {
  // Development mode: Check for mock user
  if (process.env.NODE_ENV === 'development') {
    if (typeof window !== 'undefined') {
      const mockUserData = localStorage.getItem('mockAuthUser');
      if (mockUserData) {
        try {
          return JSON.parse(mockUserData) as (User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?:string });
        } catch {
          localStorage.removeItem('mockAuthUser');
        }
      }
    }
    return null;
  }

  // Production mode: Use Firebase Auth
  const currentUser = auth.currentUser;
  if (currentUser) {
    // This will ideally be fetched from Firestore, but for a quick synchronous check
    // we can return the basic user here. Asynchronous fetching is done in onAuthStateChange.
    return currentUser as (User & { subscriptionTier?: 'free' | 'premium' | 'enterprise'; companyId?: string; role?:string });
  }
  return null;
};

// Demo user credentials for development
export const DEMO_USER = {
  username: 'zaleha',
  password: 'manor123',
  // For Firebase Auth, we'll append a domain to make it a valid email
  email: 'zaleha@witventure.com'
};

// New functions for Stage 16

export const getCompanyBranding = async (companyId: string) => {
  const companyDocRef = doc(db, "companies", companyId);
  const companyDocSnap = await getDoc(companyDocRef);
  if (companyDocSnap.exists()) {
    return CompanySchema.parse(companyDocSnap.data()).branding;
  }
  return null;
};

export const checkPendingInvite = async (email: string) => {
  const inviteDocRef = doc(db, "pendingInvites", email);
  const inviteDocSnap = await getDoc(inviteDocRef);
  if (inviteDocSnap.exists()) {
    return PendingInviteSchema.parse(inviteDocSnap.data());
  }
  return null;
};

// Mock user settings storage
const MOCK_USER_SETTINGS: { [uid: string]: UserSettings } = {
    'demo-user-123': {
        legalAlerts: true,
        newTrackAlerts: true,
        digestFrequency: 'weekly',
    }
};

// Functions to get and save user settings
export const getUserSettings = async (uid: string): Promise<UserSettings> => {
    // In a real app, this would fetch from /users/{uid}/notificationPrefs
    return MOCK_USER_SETTINGS[uid] || {
        legalAlerts: false,
        newTrackAlerts: true,
        digestFrequency: 'off',
    };
};

export const saveUserSettings = async (uid: string, settings: UserSettings): Promise<void> => {
    // In a real app, this would write to /users/{uid}/notificationPrefs
    MOCK_USER_SETTINGS[uid] = settings;
    console.log(`Saved settings for user ${uid}:`, settings);
};
