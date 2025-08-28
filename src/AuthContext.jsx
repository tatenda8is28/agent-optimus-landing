// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // We have a logged-in user, now listen to their profile document.
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const profileData = doc.data();
                        setUserProfile(profileData);
                        const isAdminUser = profileData.role === 'admin';
                        setIsAdmin(isAdminUser);

                        // --- NEW SIMPLIFIED REDIRECT LOGIC ---
                        // If this is the first time we're loading the profile after a sign-in,
                        // perform the one-time redirect.
                        if (isSignInWithEmailLink(auth, window.location.href)) {
                            // Clean the URL to prevent loops
                            window.history.replaceState({}, document.title, window.location.pathname);
                            
                            if (isAdminUser) {
                                navigate('/admin', { replace: true });
                            } else {
                                navigate('/dashboard', { replace: true });
                            }
                        }
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
    }, [navigate]);

    const value = {
        user,
        userProfile,
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