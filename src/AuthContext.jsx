// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from './firebaseClient'; // <-- Import db
import { doc, onSnapshot } from 'firebase/firestore'; // <-- Import firestore functions
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null); // <-- NEW: Store full user profile
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Magic link logic remains the same
        if (isSignInWithEmailLink(auth, window.location.href)) {
            // ... same as before
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // --- NEW: Listen to the user's Firestore document ---
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const profileData = doc.data();
                        setUserProfile(profileData);
                        // Set admin status based on the 'role' field in the database
                        setIsAdmin(profileData.role === 'admin');
                    }
                    setLoading(false);
                });
                return () => unsubProfile(); // Cleanup profile listener
            } else {
                // No user, so clear profile and set loading to false
                setUserProfile(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => unsubscribe(); // Cleanup auth listener
    }, []);

    const value = {
        user,
        userProfile, // <-- Expose the full profile
        isAdmin,
        signOut: () => signOut(auth),
    };

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