// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from './firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const profileData = doc.data();
                        setUserProfile(profileData);
                        setIsAdmin(profileData.role === 'admin');
                    }
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                setUserProfile(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const value = { user, userProfile, isAdmin, loading, signOut: () => signOut(auth) };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}