// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "project-party-6d703.firebaseapp.com",
  projectId: "project-party-6d703",
  storageBucket: "project-party-6d703.appspot.com",
  messagingSenderId: "1028521135000",
  appId: "1:1028521135000:web:edf25528f257d18f85b9ed",
  measurementId: "G-3NLRD1KZEW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Only init Analytics when supported and a key is present, so the app doesn't
// crash on startup in environments without .env or without Analytics support.
isSupported()
  .then((supported) => {
    if (supported && firebaseConfig.apiKey) getAnalytics(app);
  })
  .catch(() => {});
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();