// src/OverviewPage.jsx

import MetricCard from './MetricCard.jsx';
import './OverviewPage.css';

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

export default function OverviewPage() {
    const isSetupComplete = false;

    // The header is now removed from here and handled by the layout
    return (
        <div>
            {/* The Setup Guide is now the first thing */}
            {!isSetupComplete && (
                <div className="setup-guide-container">
                    <div className="setup-guide-header">
                        <h2>Your Agent is 60% Ready!</h2>
                        <p>Complete the following steps to unlock the full power of Agent Optimus.</p>
                    </div>
                    <div className="setup-guide-checklist">
                        <SetupGuideItem text="Account Created" status="complete" linkTo="#" />
                        <SetupGuideItem text="Complete Company Info" status="pending" linkTo="/company-info" />
                        <SetupGuideItem text="Train Your AI Agent" status="todo" linkTo="/build" />
                    </div>
                </div>
            )}

            <div className="metrics-grid" style={{marginTop: '32px'}}>
                <MetricCard title="Total Leads Captured" value={0} isLoading={false} />
                <MetricCard title="Viewings Booked" value={0} isLoading={false} />
                <MetricCard title="Avg. Response Time" value="<10s" isLoading={false} />
                <MetricCard title="Conversations Today" value={0} isLoading={false} />
            </div>
        </div>
    );
}