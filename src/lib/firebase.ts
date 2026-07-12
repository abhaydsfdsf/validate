// Simulated Firebase Auth module for clean, zero-config Vercel deployment
export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  getIdToken: () => Promise<string>;
}

export class GoogleAuthProvider {
  scopes: string[] = [];
  addScope(scope: string) {
    this.scopes.push(scope);
  }
  static credentialFromResult(result: any) {
    return {
      accessToken: result?.accessToken || "mock-google-access-token-active",
    };
  }
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope("https://www.googleapis.com/auth/calendar");
googleAuthProvider.addScope("https://www.googleapis.com/auth/calendar.events");

// Set up active user state
let currentUser: User | null = null;
const listeners: Set<(user: User | null) => void> = new Set();

// Load initial session from localStorage to ensure state persistence
const storedActive = localStorage.getItem("mock_user_active");
const storedEmail = localStorage.getItem("mock_user_email") || "abhayghodeswar81@gmail.com";
const storedName = localStorage.getItem("mock_user_name") || "Abhay Ghodeswar (Demo)";

if (storedActive === "true") {
  currentUser = {
    uid: `mock-uid-${storedEmail.replace(/[@.]/g, "-")}`,
    email: storedEmail,
    displayName: storedName,
    photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    emailVerified: true,
    phoneNumber: null,
    getIdToken: async () => `mock:${storedEmail}:${storedName}`,
  };
}

export const auth = {
  get currentUser() {
    return currentUser;
  },
};

export const onAuthStateChanged = (
  authInstance: any,
  callback: (user: User | null) => void
) => {
  listeners.add(callback);
  // Immediately call with the current state asynchronously
  setTimeout(() => {
    callback(currentUser);
  }, 0);

  return () => {
    listeners.delete(callback);
  };
};

const notifyListeners = () => {
  listeners.forEach((callback) => callback(currentUser));
};

export const signInWithPopup = async (authInstance: any, provider: any) => {
  const email = "abhayghodeswar81@gmail.com";
  const name = "Abhay Ghodeswar (Demo)";
  
  localStorage.setItem("mock_user_active", "true");
  localStorage.setItem("mock_user_email", email);
  localStorage.setItem("mock_user_name", name);
  
  currentUser = {
    uid: `mock-uid-${email.replace(/[@.]/g, "-")}`,
    email,
    displayName: name,
    photoURL: "https://lh3.googleusercontent.com/a/default-user=s96-c",
    emailVerified: true,
    phoneNumber: null,
    getIdToken: async () => `mock:${email}:${name}`,
  };

  notifyListeners();
  
  return { 
    user: currentUser,
    accessToken: "mock-google-access-token-active"
  };
};

export const signOut = async (authInstance: any) => {
  localStorage.removeItem("mock_user_active");
  localStorage.removeItem("mock_user_email");
  localStorage.removeItem("mock_user_name");
  currentUser = null;
  notifyListeners();
};

export const signInWithGoogle = async () => {
  return signInWithPopup(auth, googleAuthProvider);
};

// Mock Firestore exports if needed
export const db = undefined;
