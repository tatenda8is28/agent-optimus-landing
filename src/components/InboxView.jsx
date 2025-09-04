// src/components/InboxView.jsx
import React, { useState, useEffect } from 'react';

const ChatView = ({ lead }) => {
    if (!lead) {
        return <div className="chat-view-placeholder"><p>Select a conversation from the left.</p></div>;
    }
    return (
        <div className="chat-view">
            <div className="chat-view-header"><h3>Conversation with {lead.name}</h3></div>
            <div className="conversation-log">
                {lead.conversation?.map((msg, index) => (
                    <div key={index} className={`chat-bubble ${msg.role}`}>
                        {msg.content}
                        <span className="chat-timestamp">{msg.timestamp?.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const InboxView = ({ leads }) => {
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
        if (leads.length > 0 && !selectedLead) {
            setSelectedLead(leads[0]);
        }
    }, [leads, selectedLead]);

    return (
        <div className="inbox-view">
            <div className="conversation-list">
                <div className="inbox-header"><input type="text" placeholder="Search conversations..." className="inbox-search" /></div>
                <div className="conversation-items">
                    {leads.map(lead => (
                        <div key={lead.id} className={`conversation-item ${selectedLead?.id === lead.id ? 'active' : ''}`} onClick={() => setSelectedLead(lead)}>
                            <p className="item-name">{lead.name || lead.contact}</p>
                            <p className="item-snippet">{lead.conversation?.slice(-1)[0]?.content.substring(0, 40)}...</p>
                        </div>
                    ))}
                </div>
            </div>
            <ChatView lead={selectedLead} />
        </div>
    );
};