// src/AuthContext.jsx

import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from './firebaseClient';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // This is an existing user.
                    const profileData = userDoc.data();
                    setUserProfile(profileData);
                    const isAdminUser = profileData.role === 'admin';
                    setIsAdmin(isAdminUser);

                    // Redirect based on role
                    if (isAdminUser) {
                        navigate('/admin', { replace: true });
                    } else {
                        navigate('/dashboard', { replace: true });
                    }
                } else {
                    // This is a brand new user signing in for the first time.
                    // Send them to the wizard to complete their profile.
                    navigate('/activate', { replace: true });
                }
            } else {
                // No user is logged in
                setUserProfile(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const value = { user, userProfile, isAdmin, signOut: () => signOut(auth) };

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