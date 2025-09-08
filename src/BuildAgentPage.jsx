// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './BuildAgentPage.css';

const defaultFunnel = [
    { id: 'greeting', type: 'greeting', title: "Step 1: Greeting & Hook", text_yes: "Great! When would suit you best...", text_no: "No problem, may I ask..." },
    { id: 'qualification_timeline', type: 'qualification', title: "Step 2: Qualification - Timeline", question: "How soon are you looking to purchase?" },
    { id: 'handoff_finance', type: 'handoff', title: "Step 3: Finance Handoff", enabled: true, specialist_name: "Adel", specialist_email: "adel@example.com", handoff_message: "No problem at all..." }
];
const defaultMasterInstructions = "Always be professional and helpful. If you don't know an answer, say you will ask the agent.";
const defaultKnowledgeBase = `Common Buyer Questions...\n\nQ: What are transfer costs?\nA: Transfer costs are...`;
const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

const SortableStep = ({ step, index, onUpdate, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const renderContent = () => {
        switch(step.type) {
            case 'greeting': return ( <div><label>If Interested:</label><textarea value={step.text_yes} onChange={(e) => onUpdate(index, 'text_yes', e.target.value)} rows="3" /><label style={{marginTop: '16px'}}>If Not Interested:</label><textarea value={step.text_no} onChange={(e) => onUpdate(index, 'text_no', e.target.value)} rows="2" /></div> );
            case 'qualification': return ( <div><label>Question:</label><textarea value={step.question} onChange={(e) => onUpdate(index, 'question', e.target.value)} rows="2" /></div> );
            case 'handoff': return ( <div><div className="question-builder-item compact"><input type="checkbox" checked={step.enabled} onChange={(e) => onUpdate(index, 'enabled', e.target.checked)} /><label>Enable Specialist Handoff</label></div><div style={{opacity: step.enabled ? 1 : 0.5, marginTop: '16px'}}><div className="wizard-form-group"><label>Specialist Name:</label><input type="text" value={step.specialist_name} onChange={(e) => onUpdate(index, 'specialist_name', e.target.value)} disabled={!step.enabled} /></div><div className="wizard-form-group"><label>Specialist Email:</label><input type="email" value={step.specialist_email} onChange={(e) => onUpdate(index, 'specialist_email', e.target.value)} disabled={!step.enabled} /></div><div className="wizard-form-group"><label>Handoff Message:</label><textarea value={step.handoff_message} onChange={(e) => onUpdate(index, 'handoff_message', e.target.value)} rows="3" disabled={!step.enabled}></textarea></div></div></div> );
            default: return null;
        }
    };

    return ( <div ref={setNodeRef} style={style} className="funnel-step-card"><div className="funnel-step-header"><span className="drag-handle" {...attributes} {...listeners}>☰</span><strong className="step-title">{step.title}</strong><button className="delete-step-btn" onClick={() => onDelete(index)} title="Delete Step">🗑️</button></div><div className="funnel-step-content">{renderContent()}</div></div> );
};

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [funnelSteps, setFunnelSteps] = useState([]);
    const [masterInstructions, setMasterInstructions] = useState("");
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [personality, setPersonality] = useState(defaultPersonality);
    const [dncList, setDncList] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

    useEffect(() => {
        if (!user || !userProfile) return;
        setIsLoading(true);
        const fetchData = async () => {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const userRef = doc(db, 'users', user.uid);
            const [playbookSnap, userSnap] = await Promise.all([getDoc(playbookRef), getDoc(userRef)]);
            setFunnelSteps(playbookSnap.exists() && playbookSnap.data().steps ? playbookSnap.data().steps : defaultFunnel);
            setMasterInstructions(userSnap.exists() && userSnap.data().masterInstructions ? userSnap.data().masterInstructions : defaultMasterInstructions);
            setKnowledgeBase(userSnap.exists() && userSnap.data().knowledgeDocument ? userSnap.data().knowledgeDocument : defaultKnowledgeBase);
            setPersonality(userSnap.exists() && userSnap.data().personality ? userSnap.data().personality : defaultPersonality);
            setDncList(userSnap.exists() && userSnap.data().doNotContactList ? userSnap.data().doNotContactList.join('\n') : '');
            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const handleUpdateStep = (index, field, value) => { const newSteps = [...funnelSteps]; newSteps[index][field] = value; setFunnelSteps(newSteps); };
    const handleDeleteStep = (index) => { if (window.confirm("Are you sure you want to delete this step?")) { setFunnelSteps(funnelSteps.filter((_, i) => i !== index)); } };
    const handleAddStep = (type) => {
        let newStep;
        if (type === 'qualification') { newStep = { id: Date.now(), type: 'qualification', title: "New Custom Question", question: "" }; }
        else { newStep = { id: Date.now(), type: 'handoff', title: "New Specialist Handoff", enabled: true, specialist_name: "", specialist_email: "", handoff_message: "" }; }
        setFunnelSteps([...funnelSteps, newStep]);
    };
    const handleDragEnd = (event) => { const { active, over } = event; if (active.id !== over.id) { setFunnelSteps((items) => { const oldIndex = items.findIndex(item => item.id === active.id); const newIndex = items.findIndex(item => item.id === over.id); return arrayMove(items, oldIndex, newIndex); }); } };
    const handlePersonalityChange = (e) => setPersonality(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) }));
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, steps: funnelSteps }, { merge: true });
            const userRef = doc(db, 'users', user.uid);
            const dncArray = dncList.split('\n').filter(num => num.trim() !== '');
            await updateDoc(userRef, { masterInstructions, knowledgeDocument: knowledgeBase, personality, doNotContactList: dncArray });
            alert("All changes have been saved successfully!");
        } catch (error) { console.error("Error saving changes:", error); alert("An error occurred while saving.");
        } finally { setIsSaving(false); }
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
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={funnelSteps} strategy={verticalListSortingStrategy}>
                                {funnelSteps.map((step, index) => ( <SortableStep key={step.id} step={step} index={index} onUpdate={handleUpdateStep} onDelete={handleDeleteStep} /> ))}
                            </SortableContext>
                        </DndContext>
                        <div className="add-step-container">
                            <button className="btn btn-outline" onClick={() => handleAddStep('qualification')}>+ Add Question</button>
                            <button className="btn btn-outline" onClick={() => handleAddStep('handoff')}>+ Add Handoff</button>
                        </div>
                        <div className="form-card master-instructions"><h3>Master Instructions</h3><textarea value={masterInstructions} onChange={(e) => setMasterInstructions(e.target.value)} rows="5"></textarea></div>
                    </div>
                )}
                {activeTab === 'knowledge' && ( <div className="tab-content"><h2>The Brain: Your Agent's Knowledge</h2><div className="knowledge-editor"><textarea value={knowledgeBase} onChange={(e) => setKnowledgeBase(e.target.value)} rows="20"></textarea></div></div> )}
                {activeTab === 'personality' && ( <div className="tab-content"><h2>The Vibe: Define your agent's personality</h2><div className="form-card"><label>Professionalism</label><input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={handlePersonalityChange} className="personality-slider" /><div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div></div><div className="form-card"><label>Enthusiasm</label><input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={handlePersonalityChange} className="personality-slider" /><div className="slider-labels"><span>Calm & Concise</span><span>Eager & Expressive</span></div></div></div> )}
                {activeTab === 'dnc' && ( <div className="tab-content"><h2>Do Not Contact List</h2><div className="form-card"><label htmlFor="dnc-list">Enter one WhatsApp number per line</label><textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea></div></div> )}
            </div>
        </div>
    );
}