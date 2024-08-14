// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCTzuxGJraiDHQDVjr5iwHlNQupVKSzDE4",
  authDomain: "project-party-6d703.firebaseapp.com",
  projectId: "project-party-6d703",
  storageBucket: "project-party-6d703.appspot.com",
  messagingSenderId: "1028521135000",
  appId: "1:1028521135000:web:edf25528f257d18f85b9ed",
  measurementId: "G-3NLRD1KZEW",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();