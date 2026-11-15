import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Config is public by design (Firebase security lives in Auth + Firestore
// rules); only the API key comes from env so forks can point at their own.
const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "project-party-6d703.firebaseapp.com",
  projectId: "project-party-6d703",
  storageBucket: "project-party-6d703.appspot.com",
  messagingSenderId: "1028521135000",
  appId: "1:1028521135000:web:edf25528f257d18f85b9ed",
  measurementId: "G-3NLRD1KZEW",
};

// getAuth() throws auth/invalid-api-key synchronously when the key is
// missing, which used to blank the whole app. Without a key we run with
// accounts disabled instead; every consumer checks `firebaseEnabled`.
let app = null;
let auth = null;
if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase failed to initialise; accounts are disabled.", error);
    app = null;
    auth = null;
  }
}

export const firebaseEnabled = Boolean(auth);
export { app, auth };
export const googleProvider = firebaseEnabled ? new GoogleAuthProvider() : null;

// Analytics is optional and sizeable, so it loads after first paint.
if (app) {
  import("firebase/analytics")
    .then(({ getAnalytics, isSupported }) =>
      isSupported().then((ok) => ok && getAnalytics(app))
    )
    .catch(() => {});
}
