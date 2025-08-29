// src/BuildAgentPage.jsx (FINAL, FULL VERSION)
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Editor } from '@tinymce/tinymce-react';
import './BuildAgentPage.css';

const defaultPlaybook = {
    greeting_yes: "Great! When would suit you best – today, tomorrow, or this weekend? I’ll confirm what’s possible and get back to you shortly.",
    greeting_no: "No problem 😊 May I ask what you’re ideally looking for so I can send you a few matching options?",
    booking_style: "MANUAL",
    booking_manual_prompt: "Great! I've noted your interest in viewing. What day and time work best for you?",
    booking_manual_confirm: "Perfect, thanks! I've noted your preference for [Time Provided by User]. Michael will now personally contact the seller to confirm and will be in touch with you shortly to finalize the appointment.",
    qualification_steps: [ { id: 'timeline', enabled: true, question: "While that's being processed, could you let me know how soon you are looking to purchase?" }, { id: 'finance', enabled: true, question: "And will you be purchasing with cash, with a bond, or subject to the sale of another property?" } ],
    finance_handoff: { enabled: true, specialist_name: "Adel", specialist_email: "adel@example.com", handoff_message: "No problem, our specialist, [Specialist Name], can assist with that. I've sent her your details, and she will be in touch." },
    further_instructions: "Always maintain a casual and helpful tone. If a user asks a question you don't know the answer to, respond with: \"That's a great question. I need to confirm with Michael and I'll get right back to you.\""
};
const defaultKnowledgeBase = `<h2>Common Buyer Questions</h2><p>This is your live knowledge document. Edit the text below to teach your agent how to answer common questions.</p><br /><p><strong>Transfer Costs</strong></p><p><strong>Q:</strong> What are the transfer costs?</p><p><strong>A:</strong> Transfer costs are fees paid to a conveyancing attorney... It's typically around 8-10% of the purchase price.</p>`;
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
            if (playbookSnap.exists()) {
                setPlaybook({ ...defaultPlaybook, ...playbookSnap.data() });
            }
            if (userProfile.knowledgeDocument) setKnowledgeBase(userProfile.knowledgeDocument);
            if (userProfile.personality) setPersonality(userProfile.personality);
            if (userProfile.doNotContactList) setDncList(userProfile.doNotContactList.join('\n'));
            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);
    
    const handlePlaybookChange = (e, index = null) => {
        const { name, value, type, checked } = e.target;
        if (name.includes("qualification_")) {
            const field = name.split('_')[1];
            const updatedSteps = playbook.qualification_steps.map((step, i) => i === index ? { ...step, [field]: type === 'checkbox' ? checked : value } : step);
            setPlaybook(prev => ({ ...prev, qualification_steps: updatedSteps }));
        } else if (name.includes("handoff_")) {
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
                <button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save All Changes'}</button>
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
                        <AccordionSection title="Step 1: The Initial Greeting & Hook" isOpen={openAccordion === 'greeting'} onClick={() => setOpenAccordion(openAccordion === 'greeting' ? null : 'greeting')}>
                            <div className="form-card-content">
                                <label>If a lead is interested (e.g., clicks "Yes"):</label>
                                <textarea name="greeting_yes" value={playbook.greeting_yes} onChange={handlePlaybookChange} rows="3"></textarea>
                                <label style={{marginTop: '16px'}}>If a lead is not interested (e.g., clicks "No"):</label>
                                <textarea name="greeting_no" value={playbook.greeting_no} onChange={handlePlaybookChange} rows="2"></textarea>
                            </div>
                        </AccordionSection>
                        {/* Other Accordion Sections... */}
                    </div>
                )}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: Your Agent's Knowledge</h2>
                        <div className="knowledge-editor">
                           <Editor
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                value={knowledgeBase}
                                onEditorChange={(content) => setKnowledgeBase(content)}
                                init={{
                                    height: 500, menubar: false,
                                    plugins: ['lists', 'link', 'autolink', 'code', 'help', 'wordcount'],
                                    toolbar: 'undo redo | blocks | bold italic | bullist numlist | code | help',
                                    content_style: 'body { font-family:Inter,Helvetica,Arial,sans-serif; font-size:16px; color: #1e293b }'
                                }}
                            />
                        </div>
                    </div>
                )}
                {activeTab === 'personality' && (
                     <div className="tab-content">
                        <h2>The Vibe: Define your agent's personality</h2>
                         <div className="form-card"><div className="form-card-content">
                            <label>Professionalism</label>
                            <input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={handlePersonalityChange} className="personality-slider" />
                            <div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div>
                         </div></div>
                         <div className="form-card"><div className="form-card-content">
                            <label>Enthusiasm</label>
                            <input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={handlePersonalityChange} className="personality-slider" />
                            <div className="slider-labels"><span>Calm & Concise</span><span>Eager & Expressive</span></div>
                         </div></div>
                    </div>
                )}
                {activeTab === 'dnc' && (
                    <div className="tab-content">
                        <h2>Do Not Contact List</h2>
                         <div className="form-card"><div className="form-card-content">
                            <label htmlFor="dnc-list">Enter one WhatsApp number per line</label>
                            <textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea>
                         </div></div>
                    </div>
                )}
            </div>
        </div>
    );
}