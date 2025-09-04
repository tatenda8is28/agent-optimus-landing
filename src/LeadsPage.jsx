// src/LeadsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './LeadsPage.css';
import { PipelineView } from './components/PipelineView.jsx';
import { InboxView } from './components/InboxView.jsx';

// This will be our new modal, clean and simple
const LeadDetailModal = ({ lead, onClose }) => {
    if (!lead) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <div className="lead-modal-grid">
                    <div className="lead-profile-section">
                        <h2>Lead Profile</h2>
                        <p><strong>Name:</strong> {lead.name}</p>
                        <p><strong>Contact:</strong> {lead.contact}</p>
                        <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
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
        </div>
    );
};

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('pipeline');
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            leadsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setLeads(leadsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    if (isLoading) return <div style={{padding: '40px'}}>Loading leads...</div>;

    return (
        <div>
            <div className="page-title-header"><h1>Leads</h1></div>
            <div className="build-agent-tabs">
                <button onClick={() => setActiveView('pipeline')} className={activeView === 'pipeline' ? 'active' : ''}>🔥 Hot Leads (Pipeline)</button>
                <button onClick={() => setActiveView('inbox')} className={activeView === 'inbox' ? 'active' : ''}>📥 Inbox (All Conversations)</button>
            </div>
            <div className="tab-content-wrapper">
                {activeView === 'pipeline' && (
                    <PipelineView leads={leads} onSelectLead={setSelectedLead} />
                )}
                {activeView === 'inbox' && (
                    <InboxView leads={leads} />
                )}
            </div>
            <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </div>
    );
}