// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import './BuildAgentPage.css';

// --- Default playbook structure for a new agent ---
const defaultPlaybook = {
    greeting: "Hi [Buyer Name]! Michael here from Rawson Properties. I see you're interested in the property at [Property Address]. Thanks for your interest! Would you like to view the property?",
    booking_prompt: "Great! When are you available to view?",
    booking_confirm: "Perfect. Just to confirm, when would you like to view? For example: on Friday at 2 PM.",
    qualification_timeline: "While that's being processed, could you let me know how soon you are looking to purchase?",
    qualification_finance: "Thank you. And will you be purchasing with cash, with a bond, or subject to the sale of another property?",
    handoff_adel: "No problem, our specialist, Adel, can assist with that. I've sent her your details, and she will be in touch.",
    handoff_general: "Thank you for that information. Michael will be in touch shortly. Is there anything else I can help with?"
};

const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    
    // State for all our forms
    const [playbook, setPlaybook] = useState(defaultPlaybook);
    const [personality, setPersonality] = useState(defaultPersonality);
    const [dncList, setDncList] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // --- Fetch all configuration data when the component loads ---
    useEffect(() => {
        if (!user) return;
        
        const fetchData = async () => {
            setIsLoading(true);
            
            // 1. Fetch Sales Playbook
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const playbookSnap = await getDoc(playbookRef);
            if (playbookSnap.exists()) {
                setPlaybook(playbookSnap.data());
            }

            // 2. Fetch Personality & DNC from user profile
            if (userProfile) {
                setPersonality(userProfile.personality || defaultPersonality);
                setDncList((userProfile.doNotContactList || []).join('\n'));
            }

            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const handlePlaybookChange = (e) => {
        const { name, value } = e.target;
        setPlaybook(prev => ({ ...prev, [name]: value }));
    };

    const handlePersonalityChange = (e) => {
        const { name, value } = e.target;
        setPersonality(prev => ({ ...prev, [name]: parseFloat(value) }));
    };

    // --- Save all changes to Firestore ---
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        setSaveMessage('');

        try {
            // 1. Save Sales Playbook (using setDoc with merge to create if it doesn't exist)
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, ...playbook }, { merge: true });

            // 2. Save Personality & DNC List to the user's main profile
            const userRef = doc(db, 'users', user.uid);
            const dncArray = dncList.split('\n').filter(num => num.trim() !== '');
            await updateDoc(userRef, {
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
                <button onClick={() => setActiveTab('personality')} className={activeTab === 'personality' ? 'active' : ''}>Personality</button>
                <button onClick={() => setActiveTab('dnc')} className={activeTab === 'dnc' ? 'active' : ''}>Do Not Contact</button>
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
            </div>

            <div className="tab-content-wrapper">
                {/* --- SALES PLAYBOOK TAB --- */}
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        <h2>The Script: How your agent should sell</h2>
                        <div className="form-card">
                            <label>Initial Greeting</label>
                            <textarea name="greeting" value={playbook.greeting} onChange={handlePlaybookChange} rows="3"></textarea>
                        </div>
                        <div className="form-card">
                            <label>Booking Prompt (First Ask)</label>
                            <textarea name="booking_prompt" value={playbook.booking_prompt} onChange={handlePlaybookChange} rows="2"></textarea>
                        </div>
                        <div className="form-card">
                            <label>Booking Confirmation Prompt</label>
                            <textarea name="booking_confirm" value={playbook.booking_confirm} onChange={handlePlaybookChange} rows="2"></textarea>
                        </div>
                         <div className="form-card">
                            <label>Qualification Question (Timeline)</label>
                            <textarea name="qualification_timeline" value={playbook.qualification_timeline} onChange={handlePlaybookChange} rows="2"></textarea>
                        </div>
                         <div className="form-card">
                            <label>Qualification Question (Finance)</label>
                            <textarea name="qualification_finance" value={playbook.qualification_finance} onChange={handlePlaybookChange} rows="2"></textarea>
                        </div>
                    </div>
                )}
                {/* --- PERSONALITY TAB --- */}
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
                {/* --- DO NOT CONTACT TAB --- */}
                {activeTab === 'dnc' && (
                    <div className="tab-content">
                        <h2>Do Not Contact List</h2>
                        <div className="form-card">
                            <label htmlFor="dnc-list">Enter one WhatsApp number per line</label>
                            <textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea>
                         </div>
                    </div>
                )}
                {/* --- KNOWLEDGE BASE TAB (Placeholder) --- */}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        <h2>The Brain: What your agent needs to know</h2>
                        <div className="form-card">
                            <label>Upload Knowledge Files (PDF, DOCX, TXT)</label>
                            <div className="file-drop-zone">Drag & Drop Files Here or Click to Browse (Coming Soon)</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}