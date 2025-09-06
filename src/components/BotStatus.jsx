// src/components/BotStatus.jsx
import React from 'react';

export const BotStatus = ({ status }) => {
    const isOnline = status?.status === 'online';
    const statusText = isOnline ? 'Online' : 'Offline';
    const lastSeen = status?.lastSeen?.toDate().toLocaleString() || 'Never';

    return (
        <div className={`bot-status-container ${isOnline ? 'online' : 'offline'}`}>
            <div className="status-indicator"></div>
            <div className="status-text">
                <p className="status-title">Your AI Agent is {statusText}</p>
                <p className="status-subtitle">Last seen: {lastSeen}</p>
            </div>
        </div>
    );
};