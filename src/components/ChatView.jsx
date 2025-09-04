// src/components/ChatView.jsx
import React from 'react';

export const ChatView = ({ lead }) => {
    if (!lead) {
        return (
            <div className="chat-view-placeholder">
                <p>Select a conversation from the left to view it here.</p>
            </div>
        );
    }

    return (
        <div className="chat-view">
            <div className="chat-view-header">
                <h3>Conversation with {lead.name}</h3>
            </div>
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