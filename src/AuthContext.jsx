// src/Auth-Context.jsx

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

    // --- NEW, SIMPLIFIED useEffect for handling the entire auth flow ---
    useEffect(() => {
        // First, handle the magic link sign-in if the URL contains the link
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            
            // This is an async process, so we don't want to do anything else until it's done.
            // The onAuthStateChanged listener below will handle the result.
            signInWithEmailLink(auth, email, window.location.href)
                .then(() => {
                    // Clean up after sign-in
                    window.localStorage.removeItem('emailForSignIn');
                    // Clean the URL, but let the listener handle the redirect
                    window.history.replaceState({}, document.title, "/"); 
                })
                .catch((error) => {
                    console.error("Magic link sign-in error", error);
                    setLoading(false); // Stop loading on error
                });
        }

        // This is the primary listener for all auth changes (login, logout, token refresh)
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // If a user is logged in, listen for their profile data
                const userDocRef = doc(db, 'users', user.uid);
                const unsubProfile = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) {
                        const profileData = doc.data();
                        setUserProfile(profileData);
                        const isAdminUser = profileData.role === 'admin';
                        setIsAdmin(isAdminUser);

                        // --- THE ONLY REDIRECT LOGIC ---
                        // Once we have the profile and know their role, redirect them.
                        if (isAdminUser) {
                            navigate('/admin', { replace: true });
                        } else {
                            navigate('/dashboard', { replace: true });
                        }
                    } else {
                        // User exists in Auth, but not in Firestore. Log them out.
                        signOut(auth); 
                    }
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                // No user is logged in
                setUserProfile(null);
                setIsAdmin(false);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const value = { user, userProfile, isAdmin, signOut: () => signOut(auth) };

    // We'll show a generic loading screen until the auth state is resolved
    if (loading && !isSignInWithEmailLink(auth, window.location.href)) {
         return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading Application...</div>;
    }
    // Show a specific message while processing the magic link
    if (isSignInWithEmailLink(auth, window.location.href)) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Verifying login...</div>;
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