// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './BuildAgentPage.css';

const defaultPlaybook = {
    greeting: "Hi [Buyer Name]! This is [Agent Name]'s AI assistant from [Company Name]. I see you're interested in the property at [Property Address]. Thank you for your interest! Would you like me to help arrange a viewing?",
    booking_style: "MANUAL",
    booking_manual_prompt: "Great! What day and time would work best for you to view the property?",
    booking_manual_confirm: "Perfect, thank you. I've noted your preference. [Agent Name] will personally contact the seller to confirm and will be in touch with you shortly to finalize the appointment.",
    qualification_steps: [
        { id: 'timeline', enabled: true, question: "While that's being processed, could you let me know how soon you are looking to purchase? (e.g., Immediately, 1-3 months, 6+ months)" },
        { id: 'finance', enabled: true, question: "Thank you. And to help us find the best options for you, will you be purchasing with cash, or with a bond/home loan?" }
    ],
    finance_handoff: {
        enabled: false, specialist_name: "", specialist_email: "",
        handoff_message: "No problem at all. Our finance specialist, [Specialist Name], can assist with that. I've sent them your details, and they will be in touch shortly to help with pre-approval."
    },
};

const defaultKnowledgeBase = `Common Buyer Questions\n\nWhat are transfer costs?\nTransfer costs are fees paid to a conveyancing attorney...`;
const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

const AccordionSection = ({ title, children, isOpen, onClick }) => (
    <div className={`accordion-section ${isOpen ? 'open' : ''}`}>
        <h3 className="accordion-header" onClick={onClick}>{title}<span className="accordion-icon">{isOpen ? '−' : '+'}</span></h3>
        {isOpen && <div className="accordion-content">{children}</div>}
    </div>
);

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [openAccordion, setOpenAccordion] = useState('greeting');
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
            if (playbookSnap.exists()) { setPlaybook({ ...defaultPlaybook, ...playbookSnap.data() }); }
            
            if (userProfile.knowledgeDocument) setKnowledgeBase(userProfile.knowledgeDocument);
            if (userProfile.personality) setPersonality(userProfile.personality);
            if (userProfile.doNotContactList) setDncList(userProfile.doNotContactList.join('\n'));
            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const handlePlaybookChange = (e, index = null) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith("qualification_")) {
            const field = name.split('_')[1];
            const updatedSteps = playbook.qualification_steps.map((step, i) => i === index ? { ...step, [field]: type === 'checkbox' ? checked : value } : step);
            setPlaybook(prev => ({ ...prev, qualification_steps: updatedSteps }));
        } else if (name.startsWith("handoff_")) {
            const key = name.split('_')[1];
            setPlaybook(prev => ({ ...prev, finance_handoff: { ...prev.finance_handoff, [key]: type === 'checkbox' ? checked : value }}));
        } else {
            setPlaybook(prev => ({ ...prev, [name]: value }));
        }
    };
    const handlePersonalityChange = (e) => setPersonality(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) }));

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

    if (isLoading) return <div style={{padding: '40px'}}>Loading AI Studio...</div>;

    return (
        <div>
            <div className="page-title-header">
                <h1>Build My Agent</h1>
                <button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>
            <p className="page-subtitle">This is your AI Studio. Customize your agent's sales script, knowledge, and personality.</p>
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
                        <AccordionSection title="Step 1: Greeting & Hook" isOpen={openAccordion === 'greeting'} onClick={() => setOpenAccordion(openAccordion === 'greeting' ? null : 'greeting')}>
                            <div className="accordion-content">
                                <label>Customize the first message your agent sends to a new lead:</label>
                                <textarea name="greeting" value={playbook.greeting} onChange={handlePlaybookChange} rows="4"></textarea>
                            </div>
                        </AccordionSection>
                        
                        <AccordionSection title="Step 2: Booking Flow" isOpen={openAccordion === 'booking'} onClick={() => setOpenAccordion(openAccordion === 'booking' ? null : 'booking')}>
                            <div className="accordion-content">
                                <div className="booking-style-selector">
                                    <div className={`booking-option ${playbook.booking_style === 'MANUAL' ? 'selected' : ''}`} onClick={() => setPlaybook({...playbook, booking_style: 'MANUAL'})}><h4>Manual Confirmation</h4><p>AI captures preferred time, you finalize.</p></div>
                                    <div className={`booking-option ${playbook.booking_style === 'AUTOMATED' ? 'selected' : ''}`}><h4>Automated Booking</h4><p>AI books directly into your calendar. (Coming Soon)</p></div>
                                </div>
                                <div style={{marginTop: '24px', opacity: playbook.booking_style === 'MANUAL' ? 1 : 0.5}}>
                                    <label>Initial request for availability:</label>
                                    <textarea name="booking_manual_prompt" value={playbook.booking_manual_prompt} onChange={handlePlaybookChange} rows="2" disabled={playbook.booking_style !== 'MANUAL'}></textarea>
                                    <label style={{marginTop: '16px'}}>Final handoff message:</label>
                                    <textarea name="booking_manual_confirm" value={playbook.booking_manual_confirm} onChange={handlePlaybookChange} rows="3" disabled={playbook.booking_style !== 'MANUAL'}></textarea>
                                </div>
                            </div>
                        </AccordionSection>
                        
                        <AccordionSection title="Step 3: Qualification Funnel" isOpen={openAccordion === 'qualification'} onClick={() => setOpenAccordion(openAccordion === 'qualification' ? null : 'qualification')}>
                            <div className="accordion-content">
                                <p className="form-card-subtitle">Enable and customize the questions your agent asks after a viewing is requested.</p>
                                {playbook.qualification_steps.map((step, index) => (
                                    <div key={step.id} className="question-builder-item">
                                        <input type="checkbox" checked={step.enabled} name={`qualification_enabled`} onChange={(e) => handlePlaybookChange(e, index)} />
                                        <textarea value={step.question} name={`qualification_question`} onChange={(e) => handlePlaybookChange(e, index)} rows={2} disabled={!step.enabled}></textarea>
                                    </div>
                                ))}
                            </div>
                        </AccordionSection>

                        <AccordionSection title="Step 4: Finance Handoff" isOpen={openAccordion === 'handoff'} onClick={() => setOpenAccordion(openAccordion === 'handoff' ? null : 'handoff')}>
                           <div className="accordion-content">
                                <div className="question-builder-item compact"><input type="checkbox" name="handoff_enabled" checked={playbook.finance_handoff.enabled} onChange={handlePlaybookChange} /><label>Enable Finance Specialist Handoff</label></div>
                                <div style={{opacity: playbook.finance_handoff.enabled ? 1 : 0.5, marginTop: '16px'}}>
                                    <div className="wizard-form-group"><label>Specialist Name:</label><input type="text" name="handoff_specialist_name" value={playbook.finance_handoff.specialist_name} onChange={handlePlaybookChange} disabled={!playbook.finance_handoff.enabled} /></div>
                                    <div className="wizard-form-group"><label>Specialist Email:</label><input type="email" name="handoff_specialist_email" value={playbook.finance_handoff.specialist_email} onChange={handlePlaybookChange} disabled={!playbook.finance_handoff.enabled} /></div>
                                    <div className="wizard-form-group"><label>Handoff Message:</label><textarea name="handoff_handoff_message" value={playbook.finance_handoff.handoff_message} onChange={handlePlaybookChange} rows="3" disabled={!playbook.finance_handoff.enabled}></textarea></div>
                                </div>
                           </div>
                        </AccordionSection>
                    </div>
                )}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: Your Agent's Knowledge</h2>
                        <div className="knowledge-editor"><textarea value={knowledgeBase} onChange={(e) => setKnowledgeBase(e.target.value)} rows="20"></textarea></div>
                    </div>
                )}
                {activeTab === 'personality' && (
                     <div className="tab-content">
                        <h2>The Vibe: Define your agent's personality</h2>
                         <div className="form-card"><label>Professionalism</label><input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={handlePersonalityChange} className="personality-slider" /><div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div></div>
                         <div className="form-card"><label>Enthusiasm</label><input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={handlePersonalityChange} className="personality-slider" /><div className="slider-labels"><span>Calm & Concise</span><span>Eager & Expressive</span></div></div>
                    </div>
                )}
                {activeTab === 'dnc' && (
                    <div className="tab-content">
                        <h2>Do Not Contact List</h2>
                         <div className="form-card"><label htmlFor="dnc-list">Enter one WhatsApp number per line</label><textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea></div>
                    </div>
                )}
            </div>
        </div>
    );
}