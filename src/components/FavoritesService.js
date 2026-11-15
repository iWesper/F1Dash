import { app } from "../config/firebase";

// Firestore is only needed for favorites, so it's loaded on first use
// rather than shipped in the initial bundle.
let firestorePromise;
const loadFirestore = () => {
  if (!app) return Promise.reject(new Error("Accounts are disabled"));
  firestorePromise ??= import("firebase/firestore").then((fs) => ({
    ...fs,
    db: fs.getFirestore(app),
  }));
  return firestorePromise;
};

const favRef = (fs, userId, driverId) =>
  fs.doc(fs.db, "Favorites", `${userId}_${driverId}`);

// Add a driver to a user's favorites.
export const addFavoriteDriver = async (userId, driverId) => {
  const fs = await loadFirestore();
  await fs.setDoc(favRef(fs, userId, driverId), { userId, driverId });
};

// Remove a driver from a user's favorites.
export const removeFavoriteDriver = async (userId, driverId) => {
  const fs = await loadFirestore();
  await fs.deleteDoc(favRef(fs, userId, driverId));
};

// Fetch all favorite driver IDs for a user.
export const getFavoriteDrivers = async (userId) => {
  const fs = await loadFirestore();
  const q = fs.query(fs.collection(fs.db, "Favorites"), fs.where("userId", "==", userId));
  const snapshot = await fs.getDocs(q);
  return snapshot.docs.map((d) => d.data().driverId);
};
