// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './BuildAgentPage.css';

// --- Default structures for a new agent, matching our blueprint ---
const defaultPlaybook = {
    greeting_yes: "Great! When would suit you best – today, tomorrow, or this weekend? I’ll confirm what’s possible and get back to you shortly.",
    greeting_no: "No problem 😊 May I ask what you’re ideally looking for so I can send you a few matching options?",
    booking_style: "MANUAL", // MANUAL or AUTOMATED
    booking_manual_prompt: "Great! I've noted your interest in viewing. What day and time work best for you?",
    booking_manual_confirm: "Perfect, thanks! I've noted your preference for [Time Provided by User]. Michael will now personally contact the seller to confirm and will be in touch with you shortly to finalize the appointment.",
    qualification_steps: [
        { id: 'timeline', enabled: true, question: "While that's being processed, could you let me know how soon you are looking to purchase?" },
        { id: 'finance', enabled: true, question: "And will you be purchasing with cash, with a bond, or subject to the sale of another property?" }
    ],
    finance_handoff: {
        enabled: true,
        specialist_name: "Adel",
        specialist_email: "adel@example.com",
        handoff_message: "No problem, our specialist, [Specialist Name], can assist with that. I've sent her your details, and she will be in touch."
    },
    further_instructions: "Always maintain a casual and helpful tone. If a user asks a question you don't know the answer to, respond with: \"That's a great question. I need to confirm with Michael and I'll get right back to you.\""
};

const defaultKnowledgeBase = `
    <h2>Common Buyer Questions</h2>
    <p>This is your live knowledge document. Edit the text below to teach your agent how to answer common questions.</p>
    <br/>
    <h4><strong>Transfer Costs</strong></h4>
    <p><strong>Q:</strong> What are the transfer costs?</p>
    <p><strong>A:</strong> Transfer costs are fees paid to a conveyancing attorney to transfer the property from the seller's name into the buyer's name. It's typically around 8-10% of the purchase price but varies based on the property value.</p>
    <br/>
    <h4><strong>Offer to Purchase (OTP)</strong></h4>
    <p><strong>Q:</strong> What is an OTP?</p>
    <p><strong>A:</strong> An Offer to Purchase (OTP) is a legally binding agreement between a buyer and a seller for the sale of a property. Once signed by both parties, it becomes a valid contract.</p>
`;

export default function BuildAgentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    
    // State for all our forms
    const [playbook, setPlaybook] = useState(defaultPlaybook);
    const [knowledgeBase, setKnowledgeBase] = useState(defaultKnowledgeBase);
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            setIsLoading(true);
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const playbookSnap = await getDoc(playbookRef);
            if (playbookSnap.exists()) {
                setPlaybook({ ...defaultPlaybook, ...playbookSnap.data() });
            }

            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists() && userSnap.data().knowledgeDocument) {
                setKnowledgeBase(userSnap.data().knowledgeDocument);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    const handlePlaybookChange = (e, index = null) => {
        const { name, value, type, checked } = e.target;
        if (name === "qualification_steps") {
            const updatedSteps = playbook.qualification_steps.map((step, i) => i === index ? { ...step, question: value } : step);
            setPlaybook(prev => ({ ...prev, qualification_steps: updatedSteps }));
        } else if (name === "qualification_enabled") {
            const updatedSteps = playbook.qualification_steps.map((step, i) => i === index ? { ...step, enabled: checked } : step);
            setPlaybook(prev => ({ ...prev, qualification_steps: updatedSteps }));
        } else if (name.startsWith("handoff_")) {
            const key = name.split('_')[1];
            setPlaybook(prev => ({ ...prev, finance_handoff: { ...prev.finance_handoff, [key]: type === 'checkbox' ? checked : value }}));
        } else {
            setPlaybook(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage('');
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, ...playbook }, { merge: true });

            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                knowledgeDocument: knowledgeBase
            });
            
            setSaveMessage('All changes saved successfully!');
        } catch (error) {
            console.error("Error saving changes:", error);
            setSaveMessage('Error: Could not save changes.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };

    if (isLoading) {
        return <div style={{padding: '40px'}}>Loading AI Studio...</div>
    }

    return (
        <div>
            <div className="page-title-header">
                <h1>Build My Agent</h1>
                <button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
            <p className="page-subtitle">This is your AI Studio. Customize your agent's knowledge and sales script to perfectly match your brand.</p>
            
            {saveMessage && <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>{saveMessage}</div>}

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        {/* --- Section 1: Greeting --- */}
                        <div className="form-card">
                            <h3>Step 1: The Initial Greeting & Hook</h3>
                            <label>If a lead is interested (Clicks "Yes"):</label>
                            <textarea name="greeting_yes" value={playbook.greeting_yes} onChange={handlePlaybookChange} rows="3"></textarea>
                            <label style={{marginTop: '16px'}}>If a lead is not interested (Clicks "No"):</label>
                            <textarea name="greeting_no" value={playbook.greeting_no} onChange={handlePlaybookChange} rows="2"></textarea>
                        </div>
                        {/* --- Section 2: Booking --- */}
                        <div className="form-card">
                            <h3>Step 2: The Booking & Confirmation Flow</h3>
                            <div className="booking-style-selector">
                                <div className={`booking-option ${playbook.booking_style === 'MANUAL' ? 'selected' : ''}`} onClick={() => setPlaybook({...playbook, booking_style: 'MANUAL'})}>
                                    <h4>Manual Confirmation</h4>
                                    <p>AI captures preferred time, you contact the seller to finalize.</p>
                                </div>
                                <div className={`booking-option ${playbook.booking_style === 'AUTOMATED' ? 'selected' : ''}`}>
                                     <h4>Automated Booking</h4>
                                    <p>AI books directly into your calendar. (Coming Soon)</p>
                                </div>
                            </div>
                            <div style={{marginTop: '24px'}}>
                                <label>Initial request for availability:</label>
                                <textarea name="booking_manual_prompt" value={playbook.booking_manual_prompt} onChange={handlePlaybookChange} rows="2"></textarea>
                                <label style={{marginTop: '16px'}}>Final handoff message:</label>
                                <textarea name="booking_manual_confirm" value={playbook.booking_manual_confirm} onChange={handlePlaybookChange} rows="3"></textarea>
                            </div>
                        </div>
                        {/* --- Section 3: Qualification --- */}
                        <div className="form-card">
                            <h3>Step 3: The Qualification Funnel</h3>
                             {playbook.qualification_steps.map((step, index) => (
                                <div key={step.id} className="question-builder-item">
                                    <input type="checkbox" checked={step.enabled} name="qualification_enabled" onChange={(e) => handlePlaybookChange(e, index)} />
                                    <textarea value={step.question} name="qualification_steps" onChange={(e) => handlePlaybookChange(e, index)} rows={2} disabled={!step.enabled}></textarea>
                                </div>
                            ))}
                        </div>
                        {/* --- Section 4: Finance Handoff --- */}
                        <div className="form-card">
                           <h3>Step 4: Configure Finance Handoff</h3>
                           <div className="question-builder-item compact">
                                <input type="checkbox" name="handoff_enabled" checked={playbook.finance_handoff.enabled} onChange={handlePlaybookChange} />
                                <label>Enable Finance Specialist Handoff</label>
                           </div>
                           <div style={{opacity: playbook.finance_handoff.enabled ? 1 : 0.5, marginTop: '16px'}}>
                              <div className="wizard-form-group"><label>Specialist Name:</label><input type="text" name="handoff_specialist_name" value={playbook.finance_handoff.specialist_name} onChange={handlePlaybookChange} disabled={!playbook.finance_handoff.enabled} /></div>
                              <div className="wizard-form-group"><label>Handoff Message:</label><textarea name="handoff_handoff_message" value={playbook.finance_handoff.handoff_message} onChange={handlePlaybookChange} rows="3" disabled={!playbook.finance_handoff.enabled}></textarea></div>
                           </div>
                        </div>
                        {/* --- Section 5: Final Instructions --- */}
                        <div className="form-card">
                            <h3>Step 5: Further Instructions for Your AI</h3>
                            <label>Provide any additional, high-level instructions to guide its behavior.</label>
                            <textarea name="further_instructions" value={playbook.further_instructions} onChange={handlePlaybookChange} rows="4"></textarea>
                        </div>
                    </div>
                )}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: Your Agent's Knowledge</h2>
                        <p className="tab-description">This is your live knowledge document. Edit the text below to teach your agent how to answer common questions.</p>
                        <div className="knowledge-editor">
                           {/* A rich text editor would go here. For now, a simple textarea. */}
                           <textarea value={knowledgeBase.replace(/<br\/>/g, "\n").replace(/<[^>]*>/g, "")} onChange={(e) => setKnowledgeBase(e.target.value)} rows="20"></textarea>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}