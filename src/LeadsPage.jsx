// src/LeadsPage.jsx (SIMPLIFIED WORKING VERSION)
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import './LeadsPage.css';

const ConversationModeToggle = ({ lead, onToggle, isUpdating }) => {
    const isAIActive = lead.conversationMode !== 'manual';
    
    return (
        <div className="mode-toggle-container">
            <div className={`mode-indicator ${isAIActive ? 'ai-active' : 'manual-active'}`}>
                <span className="mode-icon">{isAIActive ? '🤖' : '👤'}</span>
                <span className="mode-text">{isAIActive ? 'AI Active' : "You're Responding"}</span>
            </div>
            <button 
                className={`btn ${isAIActive ? 'btn-primary' : 'btn-outline'}`}
                onClick={onToggle}
                disabled={isUpdating}
            >
                {isUpdating ? '...' : (isAIActive ? 'Take Over' : 'Resume AI')}
            </button>
        </div>
    );
};

const InboxView = ({ leads }) => {
    const { user } = useAuth();
    const [selectedLead, setSelectedLead] = useState(null);
    const [isUpdatingMode, setIsUpdatingMode] = useState(false);
    const [messageInput, setMessageInput] = useState('');

    useEffect(() => {
        if (leads.length > 0 && !selectedLead) {
            setSelectedLead(leads[0]);
        }
    }, [leads, selectedLead]);

    const handleModeToggle = async () => {
        if (!selectedLead) return;
        
        setIsUpdatingMode(true);
        try {
            const leadRef = doc(db, 'leads', selectedLead.id);
            const isCurrentlyAI = selectedLead.conversationMode !== 'manual';
            const newMode = isCurrentlyAI ? 'manual' : 'ai';

            await updateDoc(leadRef, {
                conversationMode: newMode,
                takenOverBy: isCurrentlyAI ? user.uid : null,
                takenOverAt: isCurrentlyAI ? Timestamp.now() : null,
                conversation: arrayUnion({
                    role: 'system',
                    content: isCurrentlyAI ? '👤 Agent took over' : '🤖 AI resumed',
                    timestamp: Timestamp.now()
                })
            });

            // Update local state
            setSelectedLead({...selectedLead, conversationMode: newMode});
        } catch (error) {
            console.error("Error toggling mode:", error);
            alert("Failed to toggle mode.");
        } finally {
            setIsUpdatingMode(false);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedLead) return;

        try {
            const leadRef = doc(db, 'leads', selectedLead.id);
            await updateDoc(leadRef, {
                conversation: arrayUnion({
                    role: 'agent',
                    content: messageInput,
                    timestamp: Timestamp.now()
                }),
                lastContactAt: Timestamp.now()
            });
            setMessageInput('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const isManualMode = selectedLead?.conversationMode === 'manual';

    return (
        <div className="inbox-view">
            <div className="conversation-list">
                <div className="inbox-header">
                    <input type="text" placeholder="Search..." className="inbox-search" />
                </div>
                <div className="conversation-items">
                    {leads.map(lead => (
                        <div 
                            key={lead.id} 
                            className={`conversation-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                            onClick={() => setSelectedLead(lead)}
                        >
                            <div className="conversation-item-header">
                                <p className="item-name">{lead.name || lead.contact}</p>
                                <span className={`mini-mode-badge ${lead.conversationMode === 'manual' ? 'manual' : 'ai'}`}>
                                    {lead.conversationMode === 'manual' ? '👤' : '🤖'}
                                </span>
                            </div>
                            <p className="item-snippet">
                                {lead.conversation?.[lead.conversation.length - 1]?.content?.substring(0, 40) || 'No messages'}...
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-view">
                {selectedLead ? (
                    <>
                        <div className="chat-mode-banner">
                            <ConversationModeToggle 
                                lead={selectedLead}
                                onToggle={handleModeToggle}
                                isUpdating={isUpdatingMode}
                            />
                        </div>
                        
                        <div className="chat-view-header">
                            <h3>Conversation with {selectedLead.name}</h3>
                        </div>
                        
                        <div className="conversation-log">
                            {selectedLead.conversation?.map((msg, index) => (
                                <div key={index} className={`chat-bubble ${msg.role}`}>
                                    {msg.content}
                                    <span className="chat-timestamp">
                                        {msg.timestamp?.toDate?.().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) || ''}
                                    </span>
                                </div>
                            ))}
                        </div>

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
                                <button className="btn btn-primary" onClick={handleSendMessage}>Send</button>
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
    );
};

const PipelineView = ({ leads }) => {
    return (
        <div className="pipeline-view">
            <div className="pipeline-controls">
                <input type="text" placeholder="Search leads..." className="filter-search-input" />
                <select className="filter-select">
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
                            <th>Timeline</th>
                            <th>Finance</th>
                            <th>Preference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map(lead => (
                            <tr key={lead.id}>
                                <td>
                                    <div className="lead-name-cell">{lead.name}</div>
                                    <div className="lead-contact-cell">{lead.contact}</div>
                                </td>
                                <td><span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span></td>
                                <td>{lead.lastContactAt?.toDate?.().toLocaleDateString() || 'N/A'}</td>
                                <td>{lead.timeline || '--'}</td>
                                <td>{lead.financial_position || '--'}</td>
                                <td className="preference-cell">{lead.preferences || '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeView, setActiveView] = useState('inbox');

    useEffect(() => {
        if (!user) return;

        const fetchLeads = async () => {
            try {
                const leadsQuery = query(
                    collection(db, 'leads'), 
                    where('agentId', '==', user.uid)
                );
                const snapshot = await getDocs(leadsQuery);
                const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                leadsData.sort((a, b) => {
                    const aTime = a.lastContactAt?.toDate?.() || 0;
                    const bTime = b.lastContactAt?.toDate?.() || 0;
                    return bTime - aTime;
                });
                setLeads(leadsData);
            } catch (error) {
                console.error("Error fetching leads:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeads();
        const interval = setInterval(fetchLeads, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [user]);

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
                {activeView === 'inbox' && <InboxView leads={leads} />}
                {activeView === 'pipeline' && <PipelineView leads={leads.filter(l => l.status !== 'Closed')} />}
            </div>
        </div>
    );
}
