// src/PlaybookDisplay.jsx

import './AdminAgentDetailPage.css'; // We'll reuse the same CSS

export default function PlaybookDisplay({ playbook }) {
    if (!playbook) {
        return <p>No sales playbook has been configured yet.</p>;
    }

    return (
        <div className="playbook-display">
            {/* --- Greeting Section --- */}
            <div className="playbook-section">
                <h4>Greeting & Hook</h4>
                <div className="playbook-item">
                    <strong>If Interested:</strong>
                    <p>{playbook.greeting_yes}</p>
                </div>
                <div className="playbook-item">
                    <strong>If Not Interested:</strong>
                    <p>{playbook.greeting_no}</p>
                </div>
            </div>

            {/* --- Booking Section --- */}
            <div className="playbook-section">
                <h4>Booking Flow</h4>
                <div className="playbook-item">
                    <strong>Booking Style:</strong>
                    <p><code>{playbook.booking_style}</code></p>
                </div>
                {playbook.booking_style === 'MANUAL' && (
                    <>
                        <div className="playbook-item">
                            <strong>Manual Prompt:</strong>
                            <p>{playbook.booking_manual_prompt}</p>
                        </div>
                        <div className="playbook-item">
                            <strong>Manual Confirm:</strong>
                            <p>{playbook.booking_manual_confirm}</p>
                        </div>
                    </>
                )}
            </div>
            
            {/* --- Qualification Section --- */}
            <div className="playbook-section">
                <h4>Qualification Funnel</h4>
                {playbook.qualification_steps?.map(step => (
                    <div className="playbook-item" key={step.id}>
                        <strong>{step.enabled ? '🟢 Enabled' : '⚪ Disabled'}:</strong>
                        <p>{step.question}</p>
                    </div>
                ))}
            </div>

            {/* --- Handoff Section --- */}
            <div className="playbook-section">
                <h4>Finance Handoff</h4>
                <div className="playbook-item">
                    <strong>Status:</strong>
                    <p>{playbook.finance_handoff?.enabled ? '🟢 Enabled' : '⚪ Disabled'}</p>
                </div>
                 {playbook.finance_handoff?.enabled && (
                    <>
                        <div className="playbook-item">
                            <strong>Specialist Name:</strong>
                            <p>{playbook.finance_handoff.specialist_name}</p>
                        </div>
                        <div className="playbook-item">
                            <strong>Handoff Message:</strong>
                            <p>{playbook.finance_handoff.handoff_message}</p>
                        </div>
                    </>
                )}
            </div>

             {/* --- Instructions Section --- */}
            <div className="playbook-section">
                <h4>Further Instructions</h4>
                <div className="playbook-item">
                    <p>{playbook.further_instructions}</p>
                </div>
            </div>
        </div>
    );
}