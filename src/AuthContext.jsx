// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <-- ADD useLocation
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
    const location = useLocation(); // <-- GET THE CURRENT LOCATION

    useEffect(() => {
        // --- THIS IS THE CORRECTED MAGIC LINK LOGIC ---
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }

            signInWithEmailLink(auth, email, window.location.href)
                .catch((error) => console.error("Error signing in with email link", error))
                .finally(() => {
                    // ** CRITICAL **
                    // Do NOT redirect here. Let the onAuthStateChanged listener handle it.
                    // Just clean the URL to prevent the loop.
                    navigate(location.pathname, { replace: true });
                    window.localStorage.removeItem('emailForSignIn');
                });
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const profileData = doc.data();
                        setUserProfile(profileData);
                        const isAdminUser = profileData.role === 'admin';
                        setIsAdmin(isAdminUser);

                        // --- THE INTELLIGENT REDIRECT LOGIC ---
                        // This runs only when we first detect the user's profile.
                        // We check if the user is on the login page, which means they just logged in.
                        if (location.pathname === '/login') {
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
    }, [navigate, location]); // <-- ADD location to dependency array

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