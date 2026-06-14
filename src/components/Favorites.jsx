import { useAuth } from './AuthProvider';
import { getFavoriteDrivers } from './FavoritesService';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Driver from './Driver';

function Favorites() {
    const { user } = useAuth();
    const [favoriteDrivers, setFavoriteDrivers] = useState([]);

    useEffect(() => {
        if (user) {
            getFavoriteDrivers(user.uid).then(setFavoriteDrivers);
        }
    }, [user]);

    if (!user) {
        return (
            <div>
                <p>You must be logged in to view your favorite drivers.</p>
                <Link to="/login">Log in</Link>
            </div>
        );
    }

    if (favoriteDrivers.length === 0) {
        return (
            <div>
                <Link to="/" className='remove-link-styles'>Back</Link>
                <h1>You haven't favorited any drivers</h1>
            </div>
        )
    }

    return (
        <div className='text-start mt-5'>
            <h1 className='text-center text-white fw-bold'>⭐ Your Favorite Drivers ⭐</h1>
            {favoriteDrivers.map(driverId => (
                <Driver key={driverId} driverId={driverId} />
            ))}
        </div>
    );
}

export default Favorites;