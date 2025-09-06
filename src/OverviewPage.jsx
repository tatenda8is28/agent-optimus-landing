// src/OverviewPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';

import MetricCard from './MetricCard.jsx';
import { SetupGuide } from './components/SetupGuide.jsx';
import { BotStatus } from './components/BotStatus.jsx';
import './OverviewPage.css';

export default function OverviewPage() {
    const { user, userProfile } = useAuth();
    const [botStatus, setBotStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // This is a simplified check for onboarding completion
    const isSetupComplete = userProfile?.companyName && userProfile?.knowledgeDocument;

    useEffect(() => {
        if (!user) return;
        
        // Listener for the bot's live status
        const statusRef = doc(db, 'bot_status', user.uid);
        const unsubscribe = onSnapshot(statusRef, (doc) => {
            if (doc.exists()) {
                setBotStatus(doc.data());
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user]);
    
    if (isLoading || !userProfile) {
        return <div style={{padding: '40px'}}>Loading Overview...</div>
    }

    return (
        <div>
            <div className="page-title-header">
                <h1>Overview</h1>
            </div>

            {/* --- INTELLIGENT ONBOARDING --- */}
            {isSetupComplete ? (
                <BotStatus status={botStatus} />
            ) : (
                <SetupGuide userProfile={userProfile} />
            )}
            
            <div className="metrics-grid" style={{marginTop: '32px'}}>
                <MetricCard title="🔥 Total Leads Captured" value={0} />
                <MetricCard title="📅 Viewings Booked" value={0} />
                <MetricCard title="💡 General Inquiries" value={0} />
                <MetricCard title="💬 Conversations Today" value={0} />
            </div>
        </div>
    );
}