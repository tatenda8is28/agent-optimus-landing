// src/LeadsPage.jsx (FINAL, FULL VERSION)
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './LeadsPage.css';
import { ConversationList } from './components/ConversationList.jsx';
import { ChatView } from './components/ChatView.jsx';

const LeadDetailModal = ({ lead, onClose }) => {
    if (!lead) return null;
    const [activeMobileTab, setActiveMobileTab] = useState('profile');
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <div className="mobile-modal-tabs"><button onClick={() => setActiveMobileTab('profile')} className={activeMobileTab === 'profile' ? 'active' : ''}>Profile</button><button onClick={() => setActiveMobileTab('conversation')} className={activeMobileTab === 'conversation' ? 'active' : ''}>Conversation</button></div>
                <div className={`lead-modal-grid mobile-view-${activeMobileTab}`}>
                    <div className="lead-profile-section"><h2>Lead Profile</h2><p><strong>Name:</strong> {lead.name}</p><p><strong>Contact:</strong> {lead.contact}</p><p><strong>Email:</strong> {lead.email || 'N/A'}</p><hr /><h3>Initial Inquiry</h3><p><strong>Property URL:</strong> <a href={lead.propertyUrl} target="_blank" rel="noopener noreferrer">View Listing</a></p><hr /><h3>Qualification</h3><p><strong>Timeline:</strong> {lead.timeline || 'N/A'}</p><p><strong>Finance:</strong> {lead.financial_position || 'N/A'}</p><p><strong>Preferences:</strong> {lead.preferences || 'N/A'}</p></div>
                    <div className="conversation-log-section"><h2>Conversation Log</h2><div className="conversation-log">{lead.conversation?.map((msg, index) => (<div key={index} className={`chat-bubble ${msg.role}`}>{msg.content}<span className="chat-timestamp">{msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>))}</div></div>
                </div>
            </div>
        </div>
    );
};

const PipelineView = ({ leads, onSelectLead }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
            const matchesSearch = searchTerm === '' || lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) || lead.contact?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [leads, searchTerm, statusFilter]);
    return (
        <div className="pipeline-view">
            <div className="pipeline-controls"><input type="text" placeholder="Search leads..." className="filter-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /><select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="All">All Statuses</option><option value="New Inquiry">New Inquiry</option><option value="Contacted">Contacted</option></select></div>
            <div className="table-wrapper"><table className="leads-table"><thead><tr><th>Lead</th><th>Status</th><th>Last Contact</th><th>Timeline</th><th>Finance</th><th>Preference</th></tr></thead><tbody>{filteredLeads.map(lead => (<tr key={lead.id} onClick={() => onSelectLead(lead)}><td><div className="lead-name-cell">{lead.name}</div><div className="lead-contact-cell">{lead.contact}</div></td><td><span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span></td><td>{lead.lastContactAt?.toDate().toLocaleDateString()}</td><td>{lead.timeline || '--'}</td><td>{lead.financial_position || '--'}</td><td className="preference-cell">{lead.preferences || '--'}</td></tr>))}</tbody></table></div>
             <div className="mobile-card-list">{filteredLeads.map(lead => (<div className="lead-row-card" key={lead.id} onClick={() => onSelectLead(lead)}><div className="lead-card-header"><p className="lead-name">{lead.name}</p><span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span></div><div className="lead-details"><div className="lead-detail-item"><span>Finance</span><span>{lead.financial_position || '--'}</span></div><div className="lead-detail-item"><span>Timeline</span><span>{lead.timeline || '--'}</span></div></div></div>))}</div>
        </div>
    );
};

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('pipeline');
    const [selectedLeadModal, setSelectedLeadModal] = useState(null);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [inboxSearchTerm, setInboxSearchTerm] = useState('');

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            leadsData.sort((a, b) => (b.lastContactAt?.toDate() || 0) - (a.lastContactAt?.toDate() || 0));
            setLeads(leadsData);
            if (leadsData.length > 0 && !selectedConversation) { setSelectedConversation(leadsData[0]); }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSelectConversation = (lead, searchTerm = inboxSearchTerm) => {
        setSelectedConversation(lead);
        setInboxSearchTerm(searchTerm);
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
                {activeView === 'pipeline' && (
                    <PipelineView leads={leads.filter(l => l.status && l.status !== 'Closed')} onSelectLead={setSelectedLeadModal} />
                )}
                {activeView === 'inbox' && (
                    <InboxView leads={leads} />
                )}
            </div>
            <LeadDetailModal lead={selectedLeadModal} onClose={() => setSelectedLeadModal(null)} />
        </div>
    );
}