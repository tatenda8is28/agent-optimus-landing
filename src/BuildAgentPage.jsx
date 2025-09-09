// src/BuildAgentPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { WrappedSalesPlaybookBuilder } from './components/SalesPlaybookBuilder.jsx';
import './BuildAgentPage.css';

const defaultKnowledgeBase = `Common Buyer Questions...\n\nQ: What are transfer costs?\nA: Transfer costs are...`;
const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [playbookData, setPlaybookData] = useState({ nodes: [], edges: [] });
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [personality, setPersonality] = useState(defaultPersonality);
    const [dncList, setDncList] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user || !userProfile) return;
        setIsLoading(true);
        const fetchData = async () => {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const userRef = doc(db, 'users', user.uid);
            const [playbookSnap, userSnap] = await Promise.all([getDoc(playbookRef), getDoc(userRef)]);
            
            if (playbookSnap.exists()) { setPlaybookData(playbookSnap.data()); }
            if (userSnap.exists()) {
                const data = userSnap.data();
                setKnowledgeBase(data.knowledgeDocument || defaultKnowledgeBase);
                setPersonality(data.personality || defaultPersonality);
                setDncList((data.doNotContactList || []).join('\n'));
            }
            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const handlePlaybookChange = useCallback((newPlaybookData) => {
        setPlaybookData(newPlaybookData);
    }, []);
    
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, ...playbookData }, { merge: true });

            const userRef = doc(db, 'users', user.uid);
            const dncArray = dncList.split('\n').filter(num => num.trim() !== '');
            await updateDoc(userRef, {
                knowledgeDocument: knowledgeBase,
                personality: personality,
                doNotContactList: dncArray
            });
            alert("All changes saved successfully!");
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };
    
    if (isLoading) return <div style={{padding: '40px'}}>Loading AI Studio...</div>;

    return (
        <div>
            <div className="page-title-header"><h1>Build My Agent</h1><button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save All Changes'}</button></div>
            <p className="page-subtitle">Design your agent's unique sales process and knowledge.</p>
            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
                <button onClick={() => setActiveTab('personality')} className={activeTab === 'personality' ? 'active' : ''}>Personality</button>
                <button onClick={() => setActiveTab('dnc')} className={activeTab === 'dnc' ? 'active' : ''}>Do Not Contact</button>
            </div>
            <div className="tab-content-wrapper">
                {activeTab === 'playbook' && <WrappedSalesPlaybookBuilder playbookData={playbookData} onPlaybookChange={handlePlaybookChange} />}
                {activeTab === 'knowledge' && ( <div className="tab-content"><h2>The Brain: Your Agent's Knowledge</h2><div className="knowledge-editor"><textarea value={knowledgeBase} onChange={(e) => setKnowledgeBase(e.target.value)} rows="20"></textarea></div></div> )}
                {activeTab === 'personality' && ( <div className="tab-content"><h2>The Vibe: Define your agent's personality</h2><div className="form-card"><label>Professionalism</label><input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={(e) => setPersonality(prev => ({...prev, [e.target.name]: parseFloat(e.target.value)}))} className="personality-slider" /><div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div></div><div className="form-card"><label>Enthusiasm</label><input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={(e) => setPersonality(prev => ({...prev, [e.target.name]: parseFloat(e.target.value)}))} className="personality-slider" /><div className="slider-labels"><span>Calm & Concise</span><span>Eager & Expressive</span></div></div></div> )}
                {activeTab === 'dnc' && ( <div className="tab-content"><h2>Do Not Contact List</h2><div className="form-card"><label htmlFor="dnc-list">Enter one WhatsApp number per line</label><textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea></div></div> )}
            </div>
        </div>
    );
}