// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORT useNavigate
import { auth, db } from './firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // <-- GET THE NAVIGATE FUNCTION

    useEffect(() => {
        // --- THIS IS THE CORRECTED MAGIC LINK LOGIC ---
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }

            signInWithEmailLink(auth, email, window.location.href)
                .then(() => {
                    // ** THE CRUCIAL FIX **
                    // After successful sign-in, remove the magic link parameters from the URL.
                    // This prevents the sign-in loop.
                    navigate('/dashboard', { replace: true }); 
                    window.localStorage.removeItem('emailForSignIn');
                })
                .catch((error) => {
                    console.error("Error signing in with email link", error);
                    // If sign-in fails, send them back to the login page to try again.
                    navigate('/login', { replace: true });
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
    }, [navigate]); // <-- ADD NAVIGATE TO DEPENDENCY ARRAY

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

// NOTE: We need to wrap the AuthProvider with the Router in main.jsx for this to work.
// I will provide that code next.

export function useAuth() {
    return useContext(AuthContext);
}