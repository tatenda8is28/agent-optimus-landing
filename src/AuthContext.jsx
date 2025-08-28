// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { auth } from './firebaseClient';
import { onAuthStateChanged, signOut, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Magic link sign-in logic (no changes here)
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
            
            if (user) {
                // --- THE CRUCIAL FIX ---
                // The `true` argument forces a refresh of the token from the server,
                // ensuring we get the latest custom claims immediately after login.
                const idTokenResult = await user.getIdTokenResult(true); 
                
                setIsAdmin(!!idTokenResult.claims.admin);
                console.log("Admin claim checked:", idTokenResult.claims.admin); // For debugging
            } else {
                setIsAdmin(false);
            }
            
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
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