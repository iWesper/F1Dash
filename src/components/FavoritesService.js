// FavoritesService.js
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"; 
import { db } from "../config/firebase"; // adjust the path as needed

// Adicionar um piloto aos favoritos de um user
export const addFavoriteDriver = async (userId, driverId) => {
    const docRef = doc(db, 'Favorites', `${userId}_${driverId}`);
    await setDoc(docRef, { userId, driverId });
};

// Remover um piloto dos favoritos de um user
export const removeFavoriteDriver = async (userId, driverId) => {
    const docRef = doc(db, 'Favorites', `${userId}_${driverId}`);
    await deleteDoc(docRef);
};

// Obter os pilotos favoritos de um user
export const getFavoriteDrivers = async (userId) => {
    const q = query(collection(db, 'Favorites'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const driverIds = querySnapshot.docs.map(doc => doc.data().driverId);
    return driverIds;
};