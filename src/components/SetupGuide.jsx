// src/components/SetupGuide.jsx
import React from 'react';

const SetupGuideItem = ({ text, status, linkTo }) => {
    const getIcon = () => {
        if (status === 'complete') return '✔️';
        if (status === 'pending') return '⏳';
        return '➡️';
    };
    return (
        <a href={linkTo} className={`setup-guide-item ${status}`}>
            <span className="setup-guide-icon">{getIcon()}</span>
            <span className="setup-guide-text">{text}</span>
        </a>
    );
};

export const SetupGuide = ({ userProfile }) => {
    const checks = {
        companyInfo: !!(userProfile.companyName && userProfile.whatsappNumber),
        aiTrained: !!(userProfile.knowledgeDocument || userProfile.playbookId) // Check if either exists
    };
    const completedCount = 1 + (checks.companyInfo ? 1 : 0) + (checks.aiTrained ? 1 : 0);
    const progress = Math.round((completedCount / 3) * 100);

    return (
        <div className="setup-guide-container">
            <div className="setup-guide-header">
                <h2>Your Agent is {progress}% Ready!</h2>
                <p>Complete the following steps to unlock the full power of Agent Optimus.</p>
            </div>
            <div className="setup-guide-checklist">
                <SetupGuideItem text="Account Created" status="complete" linkTo="/account" />
                <SetupGuideItem text="Complete Company Info" status={checks.companyInfo ? 'complete' : 'pending'} linkTo="/company-info" />
                <SetupGuideItem text="Train Your AI Agent" status={checks.aiTrained ? 'complete' : 'todo'} linkTo="/build" />
            </div>
        </div>
    );
};