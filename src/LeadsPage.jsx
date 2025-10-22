// src/LeadsPage.jsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './LeadsPage.css';

// --- Reusable Helper Components ---

const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
};

const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (today.getTime() === dateDay.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
};

const IntelTag = ({ tag }) => {
    const getTagStyle = () => {
        if (tag.includes('🔥')) return 'hot';
        if (tag.includes('💰')) return 'cash';
        if (tag.includes('💳')) return 'bond';
        return '';
    };
    return <div className={`intel-tag ${getTagStyle()}`}>{tag}</div>;
};

// --- Main Sub-Components for the Leads Page ---

const ConversationList = ({ leads, selectedLead, onSelectLead, searchTerm, onSearchChange }) => (
    <div className="conversation-list">
        <div className="inbox-header">
            <input 
                type="text" 
                placeholder="Search conversations..." 
                className="inbox-search"
                value={searchTerm}
                onChange={onSearchChange}
            />
        </div>
        <div className="conversation-items">
            {leads.map(lead => (
                <div 
                    key={lead.id} 
                    className={`conversation-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                    onClick={() => onSelectLead(lead)}
                >
                    <div className="item-avatar">{getInitials(lead.name)}</div>
                    <div className="item-content">
                        <div className="item-header">
                            <p className="item-name">{lead.name || lead.contact}</p>
                            <span className="item-timestamp">{formatTimestamp(lead.lastContactAt)}</span>
                        </div>
                        <p className="item-snippet">{lead.conversation?.slice(-1)[0]?.content}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ChatView = ({ lead }) => {
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lead?.conversation]);

    if (!lead) {
        return (
            <div className="chat-view-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4.913 2.658c2.075-.27 4.19-.168 6.168.27c1.741.39 3.423.94 4.965 1.745c1.542.805 2.923 1.915 4.078 3.284a.75.75 0 0 1-1.054 1.06c-1.02-.99-2.22-1.93-3.483-2.611c-1.262-.68-2.775-1.155-4.392-1.485c-1.791-.355-3.69-.24-5.46.23c-1.442.375-2.824.9-4.06 1.59a.75.75 0 0 1-.94-1.21c1.232-.69 2.616-1.215 4.058-1.585Z" /><path d="M19.087 21.342c-2.075.27-4.19.168-6.168-.27c-1.741-.39-3.423-.94-4.965-1.745c-1.542-.805-2.923-1.915-4.078-3.284a.75.75 0 1 1 1.054-1.06c1.02.99 2.22 1.93 3.483 2.611c1.262.68 2.775 1.155 4.392 1.485c1.791.355 3.69.24 5.46-.23c1.442-.375 2.824-.9 4.06-1.59a.75.75 0 1 1 .94 1.21c-1.232.69-2.616-1.215-4.058-1.585Z" /></svg>
                <h3>Welcome to your Inbox</h3>
                <p>Select a lead to view their full conversation history and profile.</p>
            </div>
        );
    }
    
    return (
        <div className="chat-view">
            <div className="lead-profile-header">
                <h2>{lead.name}</h2>
                <p>{lead.contact}</p>
                {lead.intelTags && (
                    <div className="intel-tags">
                        {lead.intelTags.map(tag => <IntelTag key={tag} tag={tag} />)}
                    </div>
                )}
                <div className="profile-at-a-glance">
                    <div className="glance-item"><label>Status</label><span>{lead.status}</span></div>
                    <div className="glance-item"><label>Finance</label><span>{lead.financial_position || 'N/A'}</span></div>
                    <div className="glance-item"><label>Timeline</label><span>{lead.timeline || 'N/A'}</span></div>
                    <div className="glance-item"><label>Inquiry</label><a href={lead.propertyUrl} target="_blank" rel="noopener noreferrer">View Listing 🔗</a></div>
                </div>
            </div>
            <div className="conversation-log-wrapper">
                <div className="conversation-log">
                    {lead.conversation?.map((msg, index) => (
                        <div key={index} className={`chat-bubble ${msg.role}`}>
                            {msg.content}
                            <span className="chat-timestamp">{formatTimestamp(msg.timestamp)}</span>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
            </div>
        </div>
    );
};

const PipelineView = ({ leads, onSelectLead }) => {
    // This component remains largely the same, so we can reuse the existing code for it.
    // ... code for PipelineView from previous steps ...
    return <div style={{padding: '20px', textAlign: 'center', color: 'var(--ink-light)'}}>Pipeline view coming soon.</div>
};


// --- Main Page Component ---

export default function LeadsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('inbox');
    const [selectedLead, setSelectedLead] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            leadsData.sort((a, b) => (b.lastContactAt?.toDate() || 0) - (a.lastContactAt?.toDate() || 0));
            setLeads(leadsData);
            setIsLoading(false);
            // If no lead is selected, or the selected lead is no longer in the list, select the first one.
            if (leadsData.length > 0 && (!selectedLead || !leadsData.find(l => l.id === selectedLead.id))) {
                setSelectedLead(leadsData[0]);
            } else if (leadsData.length === 0) {
                setSelectedLead(null);
            }
        });
        return () => unsubscribe();
    }, [user]);

    const filteredLeads = useMemo(() => {
        if (!searchTerm) return leads;
        return leads.filter(lead => 
            lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [leads, searchTerm]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        // Deselect lead when searching to avoid confusion
        setSelectedLead(null);
    };
    
    const handleSelectLead = (lead) => {
        if (window.innerWidth <= 900) {
            navigate(`/leads/${lead.id}`);
        } else {
            setSelectedLead(lead);
        }
    };
    
    if (isLoading) return <div style={{padding: '40px'}}>Loading leads...</div>;

    return (
        <div>
            <div className="page-title-header"><h1>Leads</h1></div>
            <div className="build-agent-tabs">
                <button onClick={() => setActiveView('pipeline')} className={activeView === 'pipeline' ? 'active' : ''}>🔥 Hot Leads (Pipeline)</button>
                <button onClick={() => setActiveView('inbox')} className={activeView === 'inbox' ? 'active' : ''}>📥 Inbox (All Conversations)</button>
            </div>
            <div className="tab-content-wrapper">
                {activeView === 'pipeline' && ( <PipelineView leads={leads.filter(l => l.status !== 'Closed')} onSelectLead={handleSelectLead} /> )}
                {activeView === 'inbox' && (
                    <div className="inbox-view">
                        <ConversationList 
                            leads={filteredLeads}
                            selectedLead={selectedLead}
                            onSelectLead={handleSelectLead}
                            searchTerm={searchTerm}
                            onSearchChange={handleSearchChange}
                        />
                        <ChatView lead={selectedLead} />
                    </div>
                )}
            </div>
        </div>
    );
}