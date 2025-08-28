// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from './firebaseClient';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false); // <-- NEW state for new users

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setIsNewUser(false); // Reset on every auth change

            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                // Use getDoc for a one-time fetch to check for existence
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // This is an existing user with a profile.
                    // Now, we can set up a real-time listener.
                    const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
                        const profileData = docSnap.data();
                        setUserProfile(profileData);
                        setIsAdmin(profileData.role === 'admin');
                        setLoading(false);
                    });
                    // We need a way to return this cleanup, but for now this is simpler.
                } else {
                    // THIS IS A BRAND NEW USER
                    setIsNewUser(true);
                    setLoading(false);
                }
            } else {
                // No user is logged in
                setUserProfile(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const value = { user, userProfile, isAdmin, isNewUser, signOut: () => signOut(auth) };

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading Application...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}