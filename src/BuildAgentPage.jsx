// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './BuildAgentPage.css';

// --- Default structures for a new agent, matching our blueprint ---
const defaultPlaybook = {
    greeting: "Hi [Buyer Name]! Michael here from Rawson Properties. I see you're interested in the property at [Property Address]. Thanks for your interest! Would you like to view the property?",
    booking_initial_prompt: "Great! When would suit you best – today, tomorrow, or this weekend?",
    booking_confirm_prompt: "Perfect. Just to confirm, when would you like to view? For example: on Friday at 2 PM.",
    qualification_steps: [
        { id: 'timeline', enabled: true, question: "While that's being processed, could you let me know how soon you are looking to purchase?" },
        { id: 'finance', enabled: true, question: "And will you be purchasing with cash or a home loan/bond?" }
    ],
    finance_handoff: {
        enabled: true,
        specialist_name: "Adel",
        specialist_email: "adel@example.com",
        handoff_message: "No problem, our specialist, [Specialist Name], can assist with that. I've sent her your details, and she will be in touch."
    }
};

const defaultKnowledgeBase = [
    { id: 1, question: "What are the transfer costs?", answer: "Transfer costs are fees paid to a conveyancing attorney to transfer the property from the seller's name into the buyer's name. It's typically around 8-10% of the purchase price but varies." },
    { id: 2, question: "What is an OTP?", answer: "An Offer to Purchase (OTP) is a legally binding agreement between a buyer and a seller for the sale of a property." }
];

const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    
    // State for all our forms
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

            setKnowledgeBase(userProfile.knowledgeBase || defaultKnowledgeBase);
            setPersonality(userProfile.personality || defaultPersonality);
            setDncList((userProfile.doNotContactList || []).join('\n'));

            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const handlePlaybookChange = (e, index) => { /* Logic from previous correct version */ };
    // This needs to be fleshed out again correctly
    const handlePlaybookChangeFull = (e, index = null) => {
        const { name, value, type, checked } = e.target;
        
        if (name.includes("qualification_")) {
            const field = name.split('_')[1];
            const updatedSteps = playbook.qualification_steps.map((step, i) => {
                if (i === index) {
                    return { ...step, [field]: type === 'checkbox' ? checked : value };
                }
                return step;
            });
            setPlaybook(prev => ({ ...prev, qualification_steps: updatedSteps }));
        } else if (name.includes("handoff_")) {
            const key = name.split('_')[1];
            const updatedHandoff = { ...playbook.finance_handoff };
            updatedHandoff[key] = type === 'checkbox' ? checked : value;
            setPlaybook(prev => ({...prev, finance_handoff: updatedHandoff}));
        } else {
            setPlaybook(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleKnowledgeChange = (index, field, value) => { /* ... */ };
    const addKnowledgeItem = () => { /* ... */ };
    const removeKnowledgeItem = (index) => { /* ... */ };
    const handlePersonalityChange = (e) => { /* ... */ };
    
    // ... Re-implementing handlers correctly ...
    const handleKnowledgeChangeFull = (index, field, value) => {
        const updatedKB = knowledgeBase.map((item, i) => i === index ? { ...item, [field]: value } : item);
        setKnowledgeBase(updatedKB);
    };
    const addKnowledgeItemFull = () => {
        setKnowledgeBase([...knowledgeBase, {id: Date.now(), question: "", answer: ""}]);
    };
    const removeKnowledgeItemFull = (index) => {
        setKnowledgeBase(knowledgeBase.filter((_, i) => i !== index));
    };
    const handlePersonalityChangeFull = (e) => {
        setPersonality(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) }));
    };


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
                knowledgeBase: knowledgeBase,
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

            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
                <button onClick={() => setActiveTab('personality')} className={activeTab === 'personality' ? 'active' : ''}>Personality</button>
                <button onClick={() => setActiveTab('dnc')} className={activeTab === 'dnc' ? 'active' : ''}>Do Not Contact</button>
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        <h2>Design Your Intelligent Booking Funnel</h2>
                        <div className="form-card">
                            <h3>Section 1: The Trigger & Hook</h3>
                            <label>What should your agent say to a new lead about a specific property?</label>
                            <textarea name="greeting" value={playbook.greeting} onChange={handlePlaybookChangeFull} rows="3"></textarea>
                        </div>
                        <div className="form-card">
                            <h3>Section 2: The Booking Flow</h3>
                            <label>Initial request for availability:</label>
                            <textarea name="booking_initial_prompt" value={playbook.booking_initial_prompt} onChange={handlePlaybookChangeFull} rows="2"></textarea>
                            <label style={{marginTop: '16px'}}>Final confirmation prompt:</label>
                            <textarea name="booking_confirm_prompt" value={playbook.booking_confirm_prompt} onChange={handlePlaybookChangeFull} rows="2"></textarea>
                        </div>
                        <div className="form-card">
                            <h3>Section 3: Post-Booking Qualification</h3>
                            <p className="form-card-subtitle">Enable and customize the questions your agent asks after a viewing is requested.</p>
                            {playbook.qualification_steps.map((step, index) => (
                                <div key={step.id} className="question-builder-item">
                                    <input type="checkbox" checked={step.enabled} name="qualification_enabled" onChange={(e) => handlePlaybookChangeFull(e, index)} />
                                    <textarea value={step.question} name="qualification_question" onChange={(e) => handlePlaybookChangeFull(e, index)} rows={2} disabled={!step.enabled}></textarea>
                                </div>
                            ))}
                        </div>
                         <div className="form-card">
                            <h3>Section 4: Finance Handoff</h3>
                             <div className="question-builder-item compact">
                                 <input type="checkbox" name="handoff_enabled" checked={playbook.finance_handoff.enabled} onChange={handlePlaybookChangeFull} />
                                 <label>Enable Finance Specialist Handoff</label>
                             </div>
                             <div style={{opacity: playbook.finance_handoff.enabled ? 1 : 0.5, marginTop: '16px'}}>
                                <div className="wizard-form-group"><label>Specialist Name:</label><input type="text" name="handoff_specialist_name" value={playbook.finance_handoff.specialist_name} onChange={handlePlaybookChangeFull} disabled={!playbook.finance_handoff.enabled} /></div>
                                <div className="wizard-form-group"><label>Specialist Email:</label><input type="email" name="handoff_specialist_email" value={playbook.finance_handoff.specialist_email} onChange={handlePlaybookChangeFull} disabled={!playbook.finance_handoff.enabled} /></div>
                                <div className="wizard-form-group"><label>Handoff Message:</label><textarea name="handoff_handoff_message" value={playbook.finance_handoff.handoff_message} onChange={handlePlaybookChangeFull} rows="3" disabled={!playbook.finance_handoff.enabled}></textarea></div>
                             </div>
                        </div>
                    </div>
                )}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: Your Agent's Knowledge</h2>
                        <p className="tab-description">Add, edit, or remove Q&A pairs. Your agent will use this information to answer common buyer questions instantly.</p>
                        {knowledgeBase.map((item, index) => (
                            <div key={item.id} className="form-card qa-item">
                                <button className="delete-qa-btn" onClick={() => removeKnowledgeItemFull(index)} title="Delete Item">&times;</button>
                                <div className="wizard-form-group">
                                    <label>When a user asks...</label>
                                    <input type="text" value={item.question} onChange={(e) => handleKnowledgeChangeFull(index, 'question', e.target.value)} placeholder="e.g., What are transfer costs?" />
                                </div>
                                <div className="wizard-form-group">
                                    <label>Your agent should answer...</label>
                                    <textarea rows="3" value={item.answer} onChange={(e) => handleKnowledgeChangeFull(index, 'answer', e.target.value)} placeholder="e.g., Transfer costs are fees paid to..."></textarea>
                                </div>
                            </div>
                        ))}
                        <button className="btn btn-outline" onClick={addKnowledgeItemFull} style={{marginTop: '16px'}}>+ Add Q&A</button>
                    </div>
                )}
                 {activeTab === 'personality' && (
                    <div className="tab-content">
                        <h2>The Vibe: Define your agent's personality</h2>
                         <div className="form-card">
                            <label>Professionalism</label>
                            <input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={handlePersonalityChangeFull} className="personality-slider" />
                            <div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div>
                         </div>
                         <div className="form-card">
                            <label>Enthusiasm</label>
                            <input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={handlePersonalityChangeFull} className="personality-slider" />
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