// src/LeadsPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import './LeadsPage.css';

const LeadDetailModal = ({ lead, onClose }) => { /* ... */ };
const InboxView = ({ leads }) => { /* ... */ };
const ChatView = ({ lead }) => { /* ... */ };

const PipelineView = ({ leads, onSelectLead }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
            const matchesSearch = searchTerm === '' || 
                lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.contact?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [leads, searchTerm, statusFilter]);

    return (
        <div className="pipeline-view">
            <div className="pipeline-controls">
                <input type="text" placeholder="Search leads..." className="filter-search-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="New Inquiry">New Inquiry</option>
                    <option value="Contacted">Contacted</option>
                </select>
            </div>
            <div className="table-wrapper">
                <table className="leads-table">
                    <thead>
                        <tr>
                            <th>Lead</th>
                            <th>Status</th>
                            <th>Last Contact</th>
                            <th>Intel</th>
                            <th>Finance</th>
                            <th>Timeline</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map(lead => (
                            <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                                <td>
                                    <div className="lead-name-cell">{lead.name}</div>
                                    <div className="lead-contact-cell">{lead.contact}</div>
                                </td>
                                <td><span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span></td>
                                <td>{lead.lastContactAt?.toDate().toLocaleDateString()}</td>
                                <td className="intel-cell">
                                    {lead.intelTags?.map(tag => (
                                        <span key={tag} className="intel-tag">{tag}</span>
                                    ))}
                                </td>
                                <td>{lead.financial_position || '--'}</td>
                                <td>{lead.timeline || '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="mobile-card-list">
                {filteredLeads.map(lead => (
                    <div className="lead-row-card" key={lead.id} onClick={() => onSelectLead(lead)}>
                        <div className="lead-card-header">
                            <p className="lead-name">{lead.name}</p>
                            <span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span>
                        </div>
                        <div className="lead-details">
                            <div className="lead-detail-item"><span>Finance</span><span>{lead.financial_position || '--'}</span></div>
                            <div className="lead-detail-item"><span>Timeline</span><span>{lead.timeline || '--'}</span></div>
                        </div>
                        <div className="intel-tags-mobile">
                            {lead.intelTags?.map(tag => (
                                <span key={tag} className="intel-tag">{tag}</span>
                            ))}
                        </div>
                    </div>
                ))}
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
            leadsData.sort((a, b) => (b.lastContactAt?.toDate() || 0) - (a.lastContactAt?.toDate() || 0));
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
                    <PipelineView leads={leads.filter(l => l.status !== 'Closed')} onSelectLead={setSelectedLead} />
                )}
                {activeView === 'inbox' && (
                    <InboxView leads={leads} />
                )}
            </div>
            <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </div>
    );
}