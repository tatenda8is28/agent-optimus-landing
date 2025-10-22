// src/LeadDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, onSnapshot } from 'firebase/firestore';
import './LeadsPage.css';

export default function LeadDetailPage() {
    const { leadId } = useParams();
    const { user } = useAuth();
    const [lead, setLead] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeMobileTab, setActiveMobileTab] = useState('profile');

    useEffect(() => {
        if (!user || !leadId) return;
        const leadRef = doc(db, 'leads', leadId);
        const unsubscribe = onSnapshot(leadRef, (doc) => {
            if (doc.exists()) {
                setLead({ id: doc.id, ...doc.data() });
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user, leadId]);

    if (isLoading) return <div style={{padding: '40px'}}>Loading lead details...</div>;
    if (!lead) return <div style={{padding: '40px'}}>Lead not found. <Link to="/leads">Go back</Link></div>;

    return (
        <div className="lead-detail-page">
            <div className="page-title-header">
                <Link to="/leads" className="back-to-list-btn-page">← Back to Leads</Link>
            </div>
            <div className="mobile-modal-tabs">
                <button onClick={() => setActiveMobileTab('profile')} className={activeMobileTab === 'profile' ? 'active' : ''}>Profile</button>
                <button onClick={() => setActiveMobileTab('conversation')} className={activeMobileTab === 'conversation' ? 'active' : ''}>Conversation</button>
            </div>
            <div className={`lead-modal-grid mobile-view-${activeMobileTab}`}>
                <div className="lead-profile-section">
                    <h2>Lead Profile</h2>
                    <p><strong>Name:</strong> {lead.name}</p>
                    <p><strong>Contact:</strong> {lead.contact}</p>
                    <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
                    <hr /><h3>Initial Inquiry</h3>
                    <p><strong>Property URL:</strong> <a href={lead.propertyUrl} target="_blank" rel="noopener noreferrer">View Listing</a></p>
                    <hr /><h3>Qualification</h3>
                    <p><strong>Timeline:</strong> {lead.timeline || 'N/A'}</p>
                    <p><strong>Finance:</strong> {lead.financial_position || 'N/A'}</p>
                    <p><strong>Preferences:</strong> {lead.preferences || 'N/A'}</p>
                </div>
                <div className="conversation-log-section">
                    <h2>Conversation Log</h2>
                    <div className="conversation-log">
                        {lead.conversation?.map((msg, index) => (
                            <div key={index} className={`chat-bubble ${msg.role}`}>
                                {msg.content}
                                <span className="chat-timestamp">{msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
