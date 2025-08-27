// src/DashboardPage.jsx

import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import logo from './assets/logo.png';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import MetricCard from './MetricCard.jsx';
import './Dashboard.css';

// --- No changes to this helper function ---
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

export default function DashboardPage() {
    const { user, signOut } = useAuth();
    const [recentLeads, setRecentLeads] = useState([]);
    const [totalLeads, setTotalLeads] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null); // <-- NEW: State for storing errors

    useEffect(() => {
        // --- START OF DEBUGGING SECTION ---
        console.log("DashboardPage useEffect triggered.");

        if (!user) {
            console.log("No user found. Waiting for user data...");
            return;
        }

        console.log("User is available. User UID:", user.uid);

        // Define the query for recent leads
        const recentLeadsQuery = query(
            collection(db, 'leads'),
            where('agentId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(5)
        );

        console.log("Attempting to create Firestore listener for recent leads...");

        const unsubscribe = onSnapshot(recentLeadsQuery, 
            (snapshot) => {
                // This block runs when we successfully receive data
                console.log("Firestore listener SUCCESS: Data received.");
                console.log("Number of documents received:", snapshot.size);

                const leadsData = snapshot.docs.map(doc => {
                    console.log("Document data:", doc.data());
                    return { id: doc.id, ...doc.data() };
                });
                
                setRecentLeads(leadsData);
                setTotalLeads(snapshot.size); // Using recent count for simplicity in debug
                setIsLoading(false);
                setError(null); // Clear any previous errors
            }, 
            (err) => {
                // This block runs if the listener fails (e.g., permission denied)
                console.error("Firestore listener FAILED:", err);
                setError("Error: Could not fetch data. Check security rules and query constraints.");
                setIsLoading(false);
            }
        );

        // This is the cleanup function
        return () => {
            console.log("Cleaning up Firestore listener.");
            unsubscribe();
        };
        // --- END OF DEBUGGING SECTION ---

    }, [user]); // This effect depends on the user object

    return (
        <div className="wizard-container">
            <header className="wizard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
                <button onClick={signOut} className="btn btn-outline">Logout</button>
            </header>
            <div className="wizard-content">
                <h1>Welcome to Mission Control</h1>
                <p style={{marginTop: '-20px', marginBottom: '32px'}}>You are logged in as: <strong>{user?.email}</strong></p>
                
                <div className="metrics-grid">
                    <MetricCard title="Recent Leads" value={totalLeads} isLoading={isLoading} />
                    <MetricCard title="Viewings Booked" value={0} isLoading={isLoading} />
                </div>

                <div className="activity-feed">
                    <h3>Recent Activity</h3>
                    {/* --- NEW: Display error messages on the screen --- */}
                    {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
                    
                    {isLoading && <p>Loading activity...</p>}
                    {!isLoading && !error && recentLeads.length === 0 && <p>No recent activity. Your agent is ready for new leads!</p>}
                    
                    {!error && recentLeads.map(lead => (
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
        </div>
    );
}