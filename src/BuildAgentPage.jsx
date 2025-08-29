// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './BuildAgentPage.css';

// --- Default structures for a new agent, matching our full blueprint ---
const defaultPlaybook = {
    greeting_yes: "Great! When would suit you best – today, tomorrow, or this weekend? I’ll confirm what’s possible and get back to you shortly.",
    greeting_no: "No problem 😊 May I ask what you’re ideally looking for so I can send you a few matching options?",
    booking_style: "MANUAL",
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
    <p><strong>A:</strong> Transfer costs are fees paid to a conveyancing attorney... It's typically around 8-10% of the purchase price.</p>
`;

const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    
    // State for ALL forms
    const [playbook, setPlaybook] = useState(defaultPlaybook);
    const [knowledgeBase, setKnowledgeBase] = useState(defaultKnowledgeBase);
    const [personality, setPersonality] = useState(defaultPersonality);
    const [dncList, setDncList] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (!user || !userProfile) return;
        const fetchData = async () => {
            setIsLoading(true);
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const playbookSnap = await getDoc(playbookRef);
            if (playbookSnap.exists()) {
                setPlaybook({ ...defaultPlaybook, ...playbookSnap.data() });
            }

            setKnowledgeBase(userProfile.knowledgeDocument || defaultKnowledgeBase);
            setPersonality(userProfile.personality || defaultPersonality);
            setDncList((userProfile.doNotContactList || []).join('\n'));
            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const handlePlaybookChange = (e, index = null) => { /* ... handler logic ... */ };
    // This needs to be fleshed out again correctly
    const handlePlaybookChangeFull = (e, index = null) => {
        const { name, value, type, checked } = e.target;
        
        if (name.startsWith("qualification_")) {
            const field = name.split('_')[1];
            const updatedSteps = playbook.qualification_steps.map((step, i) => {
                if (i === index) { return { ...step, [field]: type === 'checkbox' ? checked : value }; }
                return step;
            });
            setPlaybook(prev => ({ ...prev, qualification_steps: updatedSteps }));
        } else if (name.startsWith("handoff_")) {
            const key = name.split('_')[1];
            const updatedHandoff = { ...playbook.finance_handoff };
            updatedHandoff[key] = type === 'checkbox' ? checked : value;
            setPlaybook(prev => ({...prev, finance_handoff: updatedHandoff}));
        } else {
            setPlaybook(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleKnowledgeChange = (content) => { setKnowledgeBase(content); };
    const handlePersonalityChange = (e) => { setPersonality(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) }));};

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage('');
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, ...playbook }, { merge: true });

            const userRef = doc(db, 'users', user.uid);
            const dncArray = dncList.split('\n').filter(num => num.trim() !== '');
            await updateDoc(userRef, {
                knowledgeDocument: knowledgeBase,
                personality: personality,
                doNotContactList: dncArray
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
            <p className="page-subtitle">This is your AI Studio. Customize your agent's knowledge, sales script, and personality to perfectly match your brand.</p>
            
            {saveMessage && <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>{saveMessage}</div>}

            {/* --- ALL FOUR TABS RESTORED --- */}
            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
                <button onClick={() => setActiveTab('personality')} className={activeTab === 'personality' ? 'active' : ''}>Personality</button>
                <button onClick={() => setActiveTab('dnc')} className={activeTab === 'dnc' ? 'active' : ''}>Do Not Contact</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                         {/* --- Section 1: Greeting --- */}
                        <div className="form-card">
                            <h3>Step 1: The Initial Greeting & Hook</h3>
                            <label>If a lead is interested (e.g., clicks "Yes"):</label>
                            <textarea name="greeting_yes" value={playbook.greeting_yes} onChange={handlePlaybookChangeFull} rows="3"></textarea>
                            <label style={{marginTop: '16px'}}>If a lead is not interested (e.g., clicks "No"):</label>
                            <textarea name="greeting_no" value={playbook.greeting_no} onChange={handlePlaybookChangeFull} rows="2"></textarea>
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
                            <div style={{marginTop: '24px', opacity: playbook.booking_style === 'MANUAL' ? 1 : 0.5}}>
                                <label>Initial request for availability:</label>
                                <textarea name="booking_manual_prompt" value={playbook.booking_manual_prompt} onChange={handlePlaybookChangeFull} rows="2" disabled={playbook.booking_style !== 'MANUAL'}></textarea>
                                <label style={{marginTop: '16px'}}>Final handoff message:</label>
                                <textarea name="booking_manual_confirm" value={playbook.booking_manual_confirm} onChange={handlePlaybookChangeFull} rows="3" disabled={playbook.booking_style !== 'MANUAL'}></textarea>
                            </div>
                        </div>
                        {/* --- Section 3: Qualification --- */}
                        <div className="form-card">
                            <h3>Step 3: The Qualification Funnel</h3>
                            <p className="form-card-subtitle">Enable and customize the questions your agent asks after a viewing is requested.</p>
                             {playbook.qualification_steps.map((step, index) => (
                                <div key={step.id} className="question-builder-item">
                                    <input type="checkbox" checked={step.enabled} name="qualification_enabled" onChange={(e) => handlePlaybookChangeFull(e, index)} />
                                    <textarea value={step.question} name="qualification_question" onChange={(e) => handlePlaybookChangeFull(e, index)} rows={2} disabled={!step.enabled}></textarea>
                                </div>
                            ))}
                        </div>
                         {/* --- Section 4: Finance Handoff --- */}
                        <div className="form-card">
                           <h3>Step 4: Configure Finance Handoff</h3>
                             <div className="question-builder-item compact">
                                 <input type="checkbox" name="handoff_enabled" checked={playbook.finance_handoff.enabled} onChange={handlePlaybookChangeFull} />
                                 <label>Enable Finance Specialist Handoff</label>
                             </div>
                             <div style={{opacity: playbook.finance_handoff.enabled ? 1 : 0.5, marginTop: '16px'}}>
                                <div className="wizard-form-group"><label>Specialist Name:</label><input type="text" name="handoff_specialist_name" value={playbook.finance_handoff.specialist_name} onChange={handlePlaybookChangeFull} disabled={!playbook.finance_handoff.enabled} /></div>
                                <div className="wizard-form-group"><label>Handoff Message:</label><textarea name="handoff_handoff_message" value={playbook.finance_handoff.handoff_message} onChange={handlePlaybookChangeFull} rows="3" disabled={!playbook.finance_handoff.enabled}></textarea></div>
                             </div>
                        </div>
                        {/* --- Section 5: Final Instructions --- */}
                        <div className="form-card">
                            <h3>Step 5: Further Instructions for Your AI</h3>
                            <label>Provide any additional, high-level instructions to guide its behavior.</label>
                            <textarea name="further_instructions" value={playbook.further_instructions} onChange={handlePlaybookChangeFull} rows="4"></textarea>
                        </div>
                    </div>
                )}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: Your Agent's Knowledge</h2>
                        <p className="tab-description">This is your live knowledge document. Edit the text below to teach your agent how to answer common questions.</p>
                        <div className="knowledge-editor">
                           <textarea value={knowledgeBase.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "")} onChange={(e) => setKnowledgeBase(e.target.value)} rows="20"></textarea>
                        </div>
                    </div>
                )}
                {activeTab === 'personality' && (
                     <div className="tab-content">
                        <h2>The Vibe: Define your agent's personality</h2>
                         <div className="form-card">
                            <label>Professionalism</label>
                            <input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={handlePersonalityChange} className="personality-slider" />
                            <div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div>
                         </div>
                         <div className="form-card">
                            <label>Enthusiasm</label>
                            <input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={handlePersonalityChange} className="personality-slider" />
                            <div className="slider-labels"><span>Calm & Concise</span><span>Eager & Expressive</span></div>
                         </div>
                    </div>
                )}
                {activeTab === 'dnc' && (
                    <div className="tab-content">
                        <h2>Do Not Contact List</h2>
                         <div className="form-card">
                            <label htmlFor="dnc-list">Enter one WhatsApp number per line</label>
                            <textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea>
                         </div>
                    </div>
                )}
            </div>
        </div>
    );
}