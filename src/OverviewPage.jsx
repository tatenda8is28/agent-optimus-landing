// src/OverviewPage.jsx (FINAL, WITH ACCURATE KPIs)
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import MetricCard from './MetricCard.jsx';
import { SetupGuide } from './components/SetupGuide.jsx';
import { BotStatus } from './components/BotStatus.jsx';
import './OverviewPage.css';

export default function OverviewPage() {
    const { user, userProfile } = useAuth();
    const [botStatus, setBotStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalLeads, setTotalLeads] = useState(0);
    const [viewingsBooked, setViewingsBooked] = useState(0);
    const [conversationsToday, setConversationsToday] = useState(0);
    const isSetupComplete = userProfile?.companyName && userProfile?.knowledgeDocument;

    useEffect(() => {
        if (!user) return;
        const unsubscribers = [];
        const statusRef = doc(db, 'bot_status', user.uid);
        unsubscribers.push(onSnapshot(statusRef, (doc) => { if (doc.exists()) setBotStatus(doc.data()); setIsLoading(false); }));
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        unsubscribers.push(onSnapshot(leadsQuery, (snapshot) => { setTotalLeads(snapshot.size); }));
        
        // --- THE ACCURATE KPI FIX ---
        const bookingsQuery = query(
            collection(db, 'bookings'), 
            where('agentId', '==', user.uid), 
            where('type', '==', 'ai_booking') // Only count AI bookings
        );
        unsubscribers.push(onSnapshot(bookingsQuery, (snapshot) => { setViewingsBooked(snapshot.size); }));

        const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
        const convosQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid), where('lastContactAt', '>=', twentyFourHoursAgo));
        unsubscribers.push(onSnapshot(convosQuery, (snapshot) => { setConversationsToday(snapshot.size); }));

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]);
    
    if (isLoading || !userProfile) { return <div style={{padding: '40px'}}>Loading Overview...</div> }

    return (
        <div>
            <div className="page-title-header"><h1>Overview</h1></div>
            {isSetupComplete ? <BotStatus status={botStatus} /> : <SetupGuide userProfile={userProfile} />}
            <div className="metrics-grid" style={{marginTop: '32px'}}>
                <MetricCard title="🔥 Total Leads Captured" value={totalLeads} />
                <MetricCard title="📅 Viewings Booked" value={viewingsBooked} />
                <MetricCard title="💡 General Inquiries" value={0} />
                <MetricCard title="💬 Conversations Today" value={conversationsToday} />
            </div>
        </div>
    );
}