import React, { createContext, useState, useContext } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Determinar se o user está logged in ou não
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Log in com a conta google
  const signInWithGoogle = async () => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setUser(credential.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Registar com email e password
  const signUp = async (email, password) => {
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(credential.user);
      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
    }
  };

  // Login com email e password
  const signIn = (email, password) => {
    return auth
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        // Se o login for bem sucedido, setUser e setIsLoggedIn
        setUser(userCredential.user);
        setIsLoggedIn(true);
      })
      .catch((error) => {
        throw error; // Dar throw do error para o componente Login.js
      });
  };

  // Logout
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
