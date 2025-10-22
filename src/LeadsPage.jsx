// src/LeadsPage.jsx (UPGRADED VERSION)
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import './LeadsPage.css';

// --- NEW: Mode Toggle Component ---
const ConversationModeToggle = ({ lead, onToggle, isUpdating }) => {
    const isAIActive = lead.conversationMode !== 'manual';
    
    return (
        <div className="mode-toggle-container">
            <div className={`mode-indicator ${isAIActive ? 'ai-active' : 'manual-active'}`}>
                {isAIActive ? (
                    <>
                        <span className="mode-icon">🤖</span>
                        <span className="mode-text">AI Active</span>
                    </>
                ) : (
                    <>
                        <span className="mode-icon">👤</span>
                        <span className="mode-text">You're Responding</span>
                    </>
                )}
            </div>
            <button 
                className={`btn ${isAIActive ? 'btn-primary' : 'btn-outline'} mode-toggle-btn`}
                onClick={onToggle}
                disabled={isUpdating}
            >
                {isUpdating ? '...' : (isAIActive ? 'Take Over' : 'Resume AI')}
            </button>
        </div>
    );
};

// --- NEW: Context Summary Modal ---
const ContextSummaryModal = ({ lead, onConfirm, onCancel }) => {
    const getLeadScore = (lead) => {
        let score = 0;
        if (lead.financial_position) score += 30;
        if (lead.timeline) score += 30;
        if (lead.preferences) score += 20;
        if (lead.status === 'Viewing Booked') score += 20;
        return score;
    };

    const score = getLeadScore(lead);
    const scoreEmoji = score >= 80 ? '🔥' : score >= 50 ? '⭐' : '🧊';

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content context-summary-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onCancel}>&times;</button>
                
                <h2>📋 Conversation Summary</h2>
                <div className="context-summary">
                    <div className="summary-section">
                        <h3>Lead Information</h3>
                        <p><strong>💰 Budget:</strong> {lead.financial_position || 'Not specified'}</p>
                        <p><strong>📅 Timeline:</strong> {lead.timeline || 'Not specified'}</p>
                        <p><strong>🏠 Preferences:</strong> {lead.preferences || 'Not specified'}</p>
                        <p><strong>🎯 Lead Score:</strong> {score}/100 {scoreEmoji}</p>
                    </div>

                    <div className="summary-section">
                        <h3>📌 AI Actions Taken</h3>
                        <ul>
                            <li>✅ {lead.conversation?.length || 0} messages exchanged</li>
                            {lead.financial_position && <li>✅ Lead qualified</li>}
                            {lead.status === 'Viewing Booked' && <li>✅ Viewing scheduled</li>}
                        </ul>
                    </div>

                    <div className="summary-section last-message-section">
                        <h3>💬 Last Message</h3>
                        <p className="last-message">
                            {lead.conversation?.slice(-1)[0]?.content || 'No messages yet'}
                        </p>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={onConfirm}>Take Over Conversation</button>
                </div>
            </div>
        </div>
    );
};

// --- UPDATED: LeadDetailModal with Mode Control ---
const LeadDetailModal = ({ lead, onClose, onModeToggle, isUpdatingMode }) => {
    if (!lead) return null;
    const [activeMobileTab, setActiveMobileTab] = useState('profile');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                
                {/* NEW: Mode Toggle at Top */}
                <ConversationModeToggle 
                    lead={lead} 
                    onToggle={onModeToggle}
                    isUpdating={isUpdatingMode}
                />

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
                        <hr />
                        <h3>Qualification</h3>
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
                                    <span className="chat-timestamp">
                                        {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UPDATED: InboxView with Mode Control ---
const InboxView = ({ leads, onSelectLead }) => {
    const { user } = useAuth();
    const [selectedConv, setSelectedConv] = useState(null);
    const [isUpdatingMode, setIsUpdatingMode] = useState(false);
    const [showContextModal, setShowContextModal] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [modeFilter, setModeFilter] = useState('all'); // NEW: Mode filter

    useEffect(() => { 
        if (leads.length > 0 && !selectedConv) { 
            setSelectedConv(leads[0]); 
        } 
    }, [leads, selectedConv]);

    // NEW: Filter leads by mode
    const filteredLeads = useMemo(() => {
        if (modeFilter === 'all') return leads;
        if (modeFilter === 'ai') return leads.filter(l => l.conversationMode !== 'manual');
        if (modeFilter === 'manual') return leads.filter(l => l.conversationMode === 'manual');
        return leads;
    }, [leads, modeFilter]);

    const handleModeToggle = async (lead) => {
        const isCurrentlyAI = lead.conversationMode !== 'manual';
        
        if (isCurrentlyAI) {
            // Taking over - show context first
            setShowContextModal(true);
        } else {
            // Resuming AI - do it directly
            await confirmModeToggle(lead, false);
        }
    };

    const confirmModeToggle = async (lead, showedContext) => {
        setIsUpdatingMode(true);
        setShowContextModal(false);

        try {
            const leadRef = doc(db, 'leads', lead.id);
            const isCurrentlyAI = lead.conversationMode !== 'manual';
            const newMode = isCurrentlyAI ? 'manual' : 'ai';

            const logEntry = {
                role: 'system',
                content: isCurrentlyAI 
                    ? `👤 Agent ${user.email} took over conversation`
                    : `🤖 AI Agent resumed conversation`,
                timestamp: Timestamp.now()
            };

            await updateDoc(leadRef, {
                conversationMode: newMode,
                takenOverBy: isCurrentlyAI ? user.uid : null,
                takenOverAt: isCurrentlyAI ? Timestamp.now() : null,
                conversation: arrayUnion(logEntry)
            });

            // Send handoff message to WhatsApp lead
            // (This would trigger a Cloud Function in production)
            console.log(`Mode changed to ${newMode} for lead ${lead.id}`);

        } catch (error) {
            console.error("Error toggling mode:", error);
            alert("Failed to toggle mode. Please try again.");
        } finally {
            setIsUpdatingMode(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConv) return;

        try {
            const leadRef = doc(db, 'leads', selectedConv.id);
            const messageEntry = {
                role: 'agent',
                content: messageInput,
                timestamp: Timestamp.now(),
                sentBy: user.email
            };

            await updateDoc(leadRef, {
                conversation: arrayUnion(messageEntry),
                lastContactAt: Timestamp.now()
            });

            setMessageInput('');
            // In production, this would also send via WhatsApp API

        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        }
    };

    const isManualMode = selectedConv?.conversationMode === 'manual';

    return (
        <>
            <div className={`inbox-view ${selectedConv ? 'show-chat' : ''}`}>
                <div className="inbox-list-pane">
                    <div className="inbox-header">
                        <input type="text" placeholder="Search conversations..." className="inbox-search" />
                        {/* NEW: Mode Filter */}
                        <select 
                            className="mode-filter-select" 
                            value={modeFilter} 
                            onChange={(e) => setModeFilter(e.target.value)}
                        >
                            <option value="all">All Conversations</option>
                            <option value="ai">🤖 AI Handling</option>
                            <option value="manual">👤 You're Handling</option>
                        </select>
                    </div>
                    <div className="conversation-items">
                        {filteredLeads.map(lead => (
                            <div 
                                key={lead.id} 
                                className={`conversation-item ${selectedConv?.id === lead.id ? 'active' : ''}`} 
                                onClick={() => setSelectedConv(lead)}
                            >
                                <div className="conversation-item-header">
                                    <p className="item-name">{lead.name || lead.contact}</p>
                                    <span className={`mini-mode-badge ${lead.conversationMode === 'manual' ? 'manual' : 'ai'}`}>
                                        {lead.conversationMode === 'manual' ? '👤' : '🤖'}
                                    </span>
                                </div>
                                <p className="item-snippet">
                                    {lead.conversation?.slice(-1)[0]?.content.substring(0, 40)}...
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="inbox-chat-pane">
                    {selectedConv && (
                        <>
                            <button className="back-to-list-btn" onClick={() => setSelectedConv(null)}>← Back</button>
                            
                            {/* NEW: Mode Control Banner */}
                            <div className="chat-mode-banner">
                                <ConversationModeToggle 
                                    lead={selectedConv}
                                    onToggle={() => handleModeToggle(selectedConv)}
                                    isUpdating={isUpdatingMode}
                                />
                            </div>

                            <div className="chat-view">
                                <div className="chat-view-header">
                                    <h3>Conversation with {selectedConv.name}</h3>
                                </div>
                                <div className="conversation-log">
                                    {selectedConv.conversation?.map((msg, index) => (
                                        <div key={index} className={`chat-bubble ${msg.role}`}>
                                            {msg.content}
                                            <span className="chat-timestamp">
                                                {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* NEW: Message Input (only active in manual mode) */}
                                {isManualMode && (
                                    <div className="message-input-container">
                                        <input 
                                            type="text"
                                            placeholder="Type your message..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            className="message-input"
                                        />
                                        <button 
                                            className="btn btn-primary send-btn"
                                            onClick={handleSendMessage}
                                        >
                                            Send
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* NEW: Context Summary Modal */}
            {showContextModal && selectedConv && (
                <ContextSummaryModal 
                    lead={selectedConv}
                    onConfirm={() => confirmModeToggle(selectedConv, true)}
                    onCancel={() => setShowContextModal(false)}
                />
            )}
        </>
    );
};

// --- Original PipelineView (unchanged) ---
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
                    <thead><tr><th>Lead</th><th>Status</th><th>Last Contact</th><th>Timeline</th><th>Finance</th><th>Preference</th></tr></thead>
                    <tbody>
                        {filteredLeads.map(lead => (
                            <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                                <td><div className="lead-name-cell">{lead.name}</div><div className="lead-contact-cell">{lead.contact}</div></td>
                                <td><span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span></td>
                                <td>{lead.lastContactAt?.toDate().toLocaleDateString()}</td>
                                <td>{lead.timeline || '--'}</td>
                                <td>{lead.financial_position || '--'}</td>
                                <td className="preference-cell">{lead.preferences || '--'}</td>
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
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
export default function LeadsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('inbox'); // Changed default to inbox
    const [selectedLead, setSelectedLead] = useState(null);
    const [isUpdatingMode, setIsUpdatingMode] = useState(false);

    useEffect(() => {
        if (!user) return;
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            leadsData.sort((a, b) => (b.lastContactAt?.toDate() || 0) - (a.lastContactAt?.toDate() || 0));
            setLeads(leadsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleSelectLead = (lead) => {
        if (window.innerWidth <= 900) {
            navigate(`/leads/${lead.id}`);
        } else {
            setSelectedLead(lead);
        }
    };

    const handleModeToggle = async (lead) => {
        setIsUpdatingMode(true);
        try {
            const leadRef = doc(db, 'leads', lead.id);
            const isCurrentlyAI = lead.conversationMode !== 'manual';
            const newMode = isCurrentlyAI ? 'manual' : 'ai';

            const logEntry = {
                role: 'system',
                content: isCurrentlyAI 
                    ? `👤 Agent took over conversation`
                    : `🤖 AI Agent resumed conversation`,
                timestamp: Timestamp.now()
            };

            await updateDoc(leadRef, {
                conversationMode: newMode,
                takenOverBy: isCurrentlyAI ? user.uid : null,
                takenOverAt: isCurrentlyAI ? Timestamp.now() : null,
                conversation: arrayUnion(logEntry)
            });

        } catch (error) {
            console.error("Error toggling mode:", error);
            alert("Failed to toggle mode.");
        } finally {
            setIsUpdatingMode(false);
        }
    };

    if (isLoading) return <div style={{padding: '40px'}}>Loading leads...</div>;

    return (
        <div>
            <div className="page-title-header"><h1>Leads</h1></div>
            <div className="build-agent-tabs">
                <button onClick={() => setActiveView('inbox')} className={activeView === 'inbox' ? 'active' : ''}>
                    📥 Inbox (All Conversations)
                </button>
                <button onClick={() => setActiveView('pipeline')} className={activeView === 'pipeline' ? 'active' : ''}>
                    🔥 Hot Leads (Pipeline)
                </button>
            </div>
            <div className="tab-content-wrapper">
                {activeView === 'pipeline' && ( 
                    <PipelineView leads={leads.filter(l => l.status !== 'Closed')} onSelectLead={handleSelectLead} /> 
                )}
                {activeView === 'inbox' && ( 
                    <InboxView leads={leads} onSelectLead={handleSelectLead} /> 
                )}
            </div>
            {selectedLead && (
                <LeadDetailModal 
                    lead={selectedLead} 
                    onClose={() => setSelectedLead(null)}
                    onModeToggle={() => handleModeToggle(selectedLead)}
                    isUpdatingMode={isUpdatingMode}
                />
            )}
        </div>
    );
}
