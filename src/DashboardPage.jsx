// src/DashboardPage.jsx

import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import logo from './assets/logo.png';
import { db } from './firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import MissionControl from './MissionControl.jsx'; // We will create this next
import OnboardingView from './OnboardingView.jsx';

export default function DashboardPage() {
    const { user, signOut } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Create a reference to the user's document in the 'users' collection
        const userDocRef = doc(db, 'users', user.uid);

        // Listen for real-time changes to the user's profile
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data());
            } else {
                // This can happen if the user's auth record exists but their profile doc hasn't been created yet
                console.log("No user profile document found!");
                setUserProfile({ status: 'PENDING' }); // Default status
            }
            setIsLoading(false);
        });

        // Cleanup the listener
        return () => unsubscribe();
    }, [user]);

    const renderContent = () => {
        if (isLoading) {
            return <div>Loading Dashboard...</div>;
        }

        // --- THE "SMART" LOGIC ---
        // If the user is active, show Mission Control.
        // Otherwise, show the Onboarding View.
        if (userProfile?.status === 'ACTIVE_TRIAL' || userProfile?.status === 'PAID_SUBSCRIBER') {
            return <MissionControl user={user} />;
        } else {
            return <OnboardingView />;
        }
    };

    return (
        <div className="wizard-container">
            <header className="wizard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
                <button onClick={signOut} className="btn btn-outline">Logout</button>
            </header>
            <div className="wizard-content">
                {renderContent()}
            </div>
        </div>
    );
}