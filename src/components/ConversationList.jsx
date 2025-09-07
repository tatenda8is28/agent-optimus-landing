// src/components/ConversationList.jsx
import React from 'react';

export const ConversationList = ({ leads, selectedLead, onSelectLead, searchTerm }) => {
    const filteredLeads = leads.filter(lead => 
        lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="conversation-list">
            <div className="inbox-header">
                <input 
                    type="text" 
                    placeholder="Search conversations..." 
                    className="inbox-search"
                    value={searchTerm}
                    onChange={(e) => onSelectLead(null, e.target.value)} // Clear selection on search
                />
            </div>
            <div className="conversation-items">
                {filteredLeads.map(lead => (
                    <div 
                        key={lead.id} 
                        className={`conversation-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                        onClick={() => onSelectLead(lead)}
                    >
                        <p className="item-name">{lead.name || lead.contact}</p>
                        <p className="item-snippet">{lead.conversation?.slice(-1)[0]?.content.substring(0, 40)}...</p>
                        <span className="item-timestamp">{lead.lastContactAt?.toDate().toLocaleDateString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};