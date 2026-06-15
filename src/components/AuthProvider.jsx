import React, { createContext, useState, useContext, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Keep auth state after a page refresh: Firebase persists the session and
  // this listener restores the user when the app remounts.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoggedIn(!!currentUser);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setUser(credential.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
      throw error; // re-thrown so the calling component can show an error message
    }
  };

  const signUp = async (email, password) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(credential.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
      throw error; // re-thrown so the calling component can show an error message
    }
  };

  const signIn = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        setUser(userCredential.user);
        setIsLoggedIn(true);
      })
      .catch((error) => {
        throw error; // re-thrown so the Login component can display it
      });
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AuthContext.Provider
      value={{isLoggedIn, user, signInWithGoogle, signUp, signIn, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
