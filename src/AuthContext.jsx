// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './firebaseClient';
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false); // <-- NEW: State to track admin status
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ... (Magic link sign-in logic remains the same)
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }
            signInWithEmailLink(auth, email, window.location.href)
                .catch((error) => console.error("Error signing in with email link", error))
                .finally(() => window.localStorage.removeItem('emailForSignIn'));
        }

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            
            // --- NEW: Check for admin claim when auth state changes ---
            if (user) {
                const idTokenResult = await user.getIdTokenResult();
                // Check if the custom 'admin' claim is true
                setIsAdmin(!!idTokenResult.claims.admin);
            } else {
                // If there's no user, they are not an admin
                setIsAdmin(false);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        isAdmin, // <-- NEW: Expose admin status to the rest of the app
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