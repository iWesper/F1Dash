import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, firebaseEnabled, googleProvider } from "../config/firebase";

const AuthContext = createContext(null);

const disabled = () =>
  Promise.reject(Object.assign(new Error("Accounts are disabled"), { code: "app/disabled" }));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // False until Firebase has restored (or ruled out) a persisted session.
  // Pages gate on this so signed-in users don't see a "sign in" flash.
  const [authReady, setAuthReady] = useState(!firebaseEnabled);

  useEffect(() => {
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
  }, []);

  const value = useMemo(() => {
    if (!auth) {
      return {
        enabled: false,
        authReady,
        user: null,
        signIn: disabled,
        signUp: disabled,
        signInWithGoogle: disabled,
        resetPassword: disabled,
        signOutUser: disabled,
      };
    }
    // onAuthStateChanged updates `user` after each of these resolves.
    return {
      enabled: true,
      authReady,
      user,
      signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
      signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
      signInWithGoogle: () => signInWithPopup(auth, googleProvider),
      resetPassword: (email) => sendPasswordResetEmail(auth, email),
      signOutUser: () => signOut(auth),
    };
  }, [authReady, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** Popup dismissals are the user's choice, not an error worth showing. */
export const isPopupDismissal = (error) =>
  error?.code === "auth/popup-closed-by-user" ||
  error?.code === "auth/cancelled-popup-request";

/** Human copy for Firebase auth error codes. */
export function authErrorMessage(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "That email and password don't match an account.";
    case "auth/invalid-email":
      return "That doesn't look like a valid email address.";
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Pick a stronger password — at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/network-request-failed":
      return "You seem to be offline. Check your connection and try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google pop-up. Allow pop-ups for this site and try again.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "app/disabled":
      return "Accounts aren't available on this deployment.";
    default:
      return "Something went wrong. Please try again.";
  }
}
