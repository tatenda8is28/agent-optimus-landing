// src/LeadsPage.jsx - COMPLETE front-end file with send via backend
import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import './LeadsPage.css';

// --- Context Summary Modal ---
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
    const lastUserMessage = lead.conversation?.filter(m => m.role === 'user').slice(-1)[0];

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content context-summary-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onCancel}>&times;</button>
                
                <h2 style={{marginBottom: '8px'}}>📋 Conversation Summary</h2>
                <p style={{color: 'var(--ink-light)', marginBottom: '24px', fontSize: '14px'}}>
                    Review lead details before taking over
                </p>
                
                <div className="context-summary">
                    <div className="summary-section">
                        <h3>Lead Information</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <span className="info-label">Name</span>
                                <span className="info-value">{lead.name || 'Unknown'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Contact</span>
                                <span className="info-value">{lead.contact}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">💰 Budget</span>
                                <span className="info-value">{lead.financial_position || 'Not specified'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">📅 Timeline</span>
                                <span className="info-value">{lead.timeline || 'Not specified'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">🏠 Preferences</span>
                                <span className="info-value">{lead.preferences || 'Not specified'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">🎯 Lead Score</span>
                                <span className="info-value">{score}/100 {scoreEmoji}</span>
                            </div>
                        </div>
                    </div>

                    <div className="summary-section">
                        <h3>📌 AI Actions Taken</h3>
                        <ul className="ai-actions-list">
                            <li>✅ {lead.conversation?.length || 0} messages exchanged</li>
                            {lead.financial_position && <li>✅ Lead qualified (Budget identified)</li>}
                            {lead.timeline && <li>✅ Timeline confirmed</li>}
                            {lead.status === 'Viewing Booked' && <li>✅ Viewing scheduled</li>}
                            {!lead.financial_position && !lead.timeline && <li>⏳ Qualification in progress</li>}
                        </ul>
                    </div>

                    {lastUserMessage && (
                        <div className="summary-section">
                            <h3>💬 Last User Message</h3>
                            <div className="last-message-box">
                                <p>{lastUserMessage.content}</p>
                                <span className="last-message-time">
                                    {lastUserMessage.timestamp?.toDate().toLocaleString()}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-actions">
                    <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={onConfirm}>
                        Take Over Conversation →
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Lead Detail Modal ---
const LeadDetailModal = ({ lead, onClose }) => {
    if (!lead) return null;
    const [activeMobileTab, setActiveMobileTab] = useState('profile');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                
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

// --- Pipeline View ---
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

// --- Inbox View with Message Input & backend send ---
const InboxView = ({ leads }) => {
    const { user } = useAuth();
    const [selectedConv, setSelectedConv] = useState(null);
    const [isUpdatingMode, setIsUpdatingMode] = useState(false);
    const [showContextModal, setShowContextModal] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatLogRef = useRef(null);
    const textareaRef = useRef(null);
    const API_BASE = process.env.REACT_APP_API_BASE || '';

    useEffect(() => { 
        if (leads.length > 0 && !selectedConv) { 
            setSelectedConv(leads[0]); 
        }
        if (selectedConv) {
            const updatedLead = leads.find(l => l.id === selectedConv.id);
            if (updatedLead) {
                setSelectedConv(updatedLead);
            }
        }
    }, [leads]);

    useEffect(() => {
        if (chatLogRef.current) {
            chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
        }
    }, [selectedConv?.conversation]);

    useEffect(() => {
        if (selectedConv?.conversationMode === 'manual' && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [selectedConv?.conversationMode]);

    const handleTakeOverClick = () => {
        setShowContextModal(true);
    };

    const confirmTakeOver = async () => {
        if (!selectedConv) return;
        setShowContextModal(false);
        setIsUpdatingMode(true);
        try {
            const leadRef = doc(db, 'leads', selectedConv.id);
            await updateDoc(leadRef, {
                conversationMode: 'manual',
                takenOverBy: user.uid,
                takenOverAt: Timestamp.now(),
                lastContactAt: Timestamp.now(),
                conversation: arrayUnion({
                    role: 'system',
                    content: '👤 Agent took over the conversation',
                    timestamp: Timestamp.now()
                })
            });
        } catch (error) {
            console.error("❌ Error taking over:", error);
            alert(`Failed to take over: ${error.message}`);
        } finally {
            setIsUpdatingMode(false);
        }
    };

    const handleResumeAI = async () => {
        if (!selectedConv) return;
        setIsUpdatingMode(true);
        try {
            const leadRef = doc(db, 'leads', selectedConv.id);
            await updateDoc(leadRef, {
                conversationMode: 'ai',
                takenOverBy: null,
                takenOverAt: null,
                lastContactAt: Timestamp.now(),
                conversation: arrayUnion({
                    role: 'system',
                    content: '🤖 AI agent resumed the conversation',
                    timestamp: Timestamp.now()
                })
            });
        } catch (error) {
            console.error("❌ Error resuming AI:", error);
            alert(`Failed to resume AI: ${error.message}`);
        } finally {
            setIsUpdatingMode(false);
        }
    };

    // === NEW: send via backend to actually deliver to WhatsApp AND write Firestore ===
    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConv || isSending) return;

        const messageToSend = messageInput.trim();
        setMessageInput('');
        setIsSending(true);

        try {
            const response = await fetch(`${API_BASE}/api/sendMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-agent-id': user.uid
                },
                body: JSON.stringify({
                    leadId: selectedConv.id,
                    message: messageToSend,
                    sentBy: user.email
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Failed to send message:', err);
                alert(`Failed to send message: ${err.error || response.statusText}`);
                setMessageInput(messageToSend); // restore
                return;
            }

            // success — backend wrote to Firestore; onSnapshot will refresh UI
            console.log('✅ Sent message via backend');
        } catch (error) {
            console.error('❌ Error sending message:', error);
            alert('Failed to send message. Please try again.');
            setMessageInput(messageToSend);
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const isManualMode = (selectedConv?.conversationMode || 'ai') === 'manual';

    return (
        <>
            <div className={`inbox-view ${selectedConv ? 'show-chat' : ''}`}>
                <div className="inbox-list-pane">
                    <div className="inbox-header">
                        <input type="text" placeholder="Search conversations..." className="inbox-search" />
                    </div>
                    <div className="conversation-items">
                        {leads.map(lead => {
                            const mode = lead.conversationMode || 'ai';
                            const lastMsg = lead.conversation?.slice(-1)[0];
                            return (
                                <div 
                                    key={lead.id} 
                                    className={`conversation-item ${selectedConv?.id === lead.id ? 'active' : ''}`} 
                                    onClick={() => setSelectedConv(lead)}
                                >
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px'}}>
                                        <p className="item-name">{lead.name || lead.contact}</p>
                                        <span style={{fontSize: '18px'}}>{mode === 'manual' ? '👤' : '🤖'}</span>
                                    </div>
                                    <p className="item-snippet">
                                        {lastMsg?.content?.substring(0, 40) || 'No messages'}...
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="inbox-chat-pane">
                    {selectedConv ? (
                        <>
                            <button className="back-to-list-btn" onClick={() => setSelectedConv(null)}>← Back</button>
                            
                            <div className="mode-toggle-banner">
                                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                    <span style={{fontSize: '20px'}}>
                                        {isManualMode ? '👤' : '🤖'}
                                    </span>
                                    <span style={{fontWeight: 600, color: 'var(--ink)'}}>
                                        {isManualMode ? "You're Responding" : 'AI Active'}
                                    </span>
                                </div>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={isManualMode ? handleResumeAI : handleTakeOverClick} 
                                    disabled={isUpdatingMode}
                                    style={{minWidth: '120px'}}
                                >
                                    {isUpdatingMode ? 'Loading...' : (isManualMode ? 'Resume AI' : 'Take Over')}
                                </button>
                            </div>
                            
                            <div className="chat-view">
                                <div className="chat-view-header">
                                    <h3>Conversation with {selectedConv.name}</h3>
                                </div>
                                <div className="conversation-log" ref={chatLogRef}>
                                    {selectedConv.conversation?.map((msg, index) => (
                                        <div key={index} className={`chat-bubble ${msg.role}`}>
                                            {msg.content}
                                            <span className="chat-timestamp">
                                                {msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isManualMode && (
                                <div className="whatsapp-input-container">
                                    <textarea
                                        ref={textareaRef}
                                        className="whatsapp-input"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        disabled={isSending}
                                    />
                                    <button 
                                        className="whatsapp-send-btn" 
                                        onClick={handleSendMessage}
                                        disabled={!messageInput.trim() || isSending}
                                    >
                                        {isSending ? '...' : '➤'}
                                    </button>
                                </div>
                            )}

                            {process.env.NODE_ENV === 'development' && (
                                <div style={{padding: '8px', background: '#f0f0f0', fontSize: '11px', borderTop: '1px solid #ccc'}}>
                                    Mode: {selectedConv.conversationMode || 'ai'} | Is Manual: {isManualMode ? 'YES' : 'NO'}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="chat-view-placeholder">
                            <p>Select a conversation from the left</p>
                        </div>
                    )}
                </div>
            </div>

            {showContextModal && selectedConv && (
                <ContextSummaryModal 
                    lead={selectedConv}
                    onConfirm={confirmTakeOver}
                    onCancel={() => setShowContextModal(false)}
                />
            )}
        </>
    );
};

// --- Main Component ---
export default function LeadsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('inbox');
    const [selectedLead, setSelectedLead] = useState(null);

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
                    <InboxView leads={leads} /> 
                )}
            </div>
            {selectedLead && (
                <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
            )}
        </div>
    );
}
