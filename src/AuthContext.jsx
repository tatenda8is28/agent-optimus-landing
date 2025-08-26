// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './firebaseClient';
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This handles the user clicking the magic link in their email
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            
            signInWithEmailLink(auth, email, window.location.href)
                .catch((error) => console.error("Error signing in with email link", error))
                .finally(() => {
                    window.localStorage.removeItem('emailForSignIn');
                });
        }

        // This listener is the core of the auth system.
        // It updates the `user` state whenever the user logs in or out.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Cleanup the listener when the app unmounts
        return () => unsubscribe();
    }, []);

    const value = {
        user,
        signOut: () => signOut(auth),
    };

    // Render a loading state while we check if a user is logged in
    if (loading) {
        return <div>Loading authentication state...</div>;
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// This is a helper hook to easily access auth state from any component
export function useAuth() {
    return useContext(AuthContext);
}