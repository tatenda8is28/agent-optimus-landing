// src/OnboardingView.jsx

import './OnboardingView.css'; // We will create this file next

const OnboardingChecklistItem = ({ text, status }) => {
    const getIcon = () => {
        if (status === 'complete') return '✔️';
        if (status === 'pending') return '⏳';
        return '📋';
    };
    return (
        <div className={`onboarding-checklist-item ${status}`}>
            <span className="checklist-icon">{getIcon()}</span>
            <span className="checklist-text">{text}</span>
        </div>
    );
};

export default function OnboardingView() {
    return (
        <div className="onboarding-view">
            <h1>Activation in Progress...</h1>
            <p>Thank you! We have everything we need. Your AI assistant is now being built and will be submitted for official WhatsApp review.</p>
            
            <div className="onboarding-checklist">
                <OnboardingChecklistItem text="Account Created" status="complete" />
                <OnboardingChecklistItem text="AI Bot Configuration" status="pending" />
                <OnboardingChecklistItem text="WhatsApp Integration Review" status="todo" />
                <OnboardingChecklistItem text="Go Live!" status="todo" />
            </div>

            <div className="while-you-wait">
                <h3>While you wait, prepare for success:</h3>
                <div className="wizard-next-steps">
                    <a href="#" className="btn btn-outline full-width">Watch Quickstart Guide</a>
                    <a href="https://calendly.com/your-link" target="_blank" rel="noopener noreferrer" className="btn btn-outline full-width">Book Your Free Onboarding Call</a>
                </div>
            </div>
        </div>
    );
}