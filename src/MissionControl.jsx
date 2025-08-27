// src/MissionControl.jsx

import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import MetricCard from './MetricCard.jsx';
import './Dashboard.css'; // This CSS is now shared by both components

function formatTimeAgo(timestamp) {
    if (!timestamp) return '...';
    const now = new Date();
    const date = timestamp.toDate();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
}

export default function MissionControl({ user }) {
    const [recentLeads, setRecentLeads] = useState([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const recentLeadsQuery = query(
            collection(db, 'leads'),
            where('agentId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
        );
        const unsubscribeRecent = onSnapshot(recentLeadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRecentLeads(leadsData);
            setIsLoading(false);
        });

        const allLeadsQuery = query(
            collection(db, 'leads'),
            where('agentId', '==', user.uid)
        );
        const unsubscribeTotal = onSnapshot(allLeadsQuery, (snapshot) => {
            setTotalLeads(snapshot.size);
        });

        return () => {
            unsubscribeRecent();
            unsubscribeTotal();
        };
    }, [user]);

    return (
        <div>
            <h1>Welcome to Mission Control</h1>
            <p style={{marginTop: '-20px', marginBottom: '32px'}}>You are logged in as: <strong>{user?.email}</strong></p>
            
            <div className="metrics-grid">
                <MetricCard title="Total Leads Captured" value={totalLeads} isLoading={isLoading} />
                <MetricCard title="Viewings Booked" value={0} isLoading={isLoading} />
            </div>

            <div className="activity-feed">
                <h3>Recent Activity</h3>
                {isLoading && <p>Loading activity...</p>}
                {!isLoading && recentLeads.length === 0 && <p>No recent activity. Your agent is ready for new leads!</p>}
                {recentLeads.map(lead => (
                    <div key={lead.id} className="activity-item">
                        <div className="activity-details">
                            {lead.name} 
                            <span>{lead.status}</span>
                        </div>
                        <div className="activity-time">{formatTimeAgo(lead.createdAt)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}