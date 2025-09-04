// src/components/ConversationList.jsx
import React from 'react';

export const ConversationList = ({ leads, selectedLead, onSelectLead }) => {
    return (
        <div className="conversation-list">
            <div className="inbox-header">
                <input type="text" placeholder="Search conversations..." className="inbox-search" />
            </div>
            <div className="conversation-items">
                {leads.map(lead => (
                    <div 
                        key={lead.id} 
                        className={`conversation-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                        onClick={() => onSelectLead(lead)}
                    >
                        <p className="item-name">{lead.name || lead.contact}</p>
                        <p className="item-snippet">{lead.conversation?.slice(-1)[0]?.content.substring(0, 40)}...</p>
                        <span className="item-timestamp">{lead.createdAt?.toDate().toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};