// src/BuildAgentPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './BuildAgentPage.css';

const defaultFunnel = [
    { id: 1, type: 'greeting', title: "Step 1: Greeting & Hook", text_yes: "Great! When would suit you best...", text_no: "No problem, may I ask..." },
    { id: 2, type: 'qualification', title: "Step 2: Qualification", question: "How soon are you looking to purchase?" },
    { id: 3, type: 'handoff', title: "Step 3: Finance Handoff", enabled: true, specialist_name: "Adel" }
];

// Reusable, Draggable Step Component
const SortableStep = ({ step, index, onUpdate, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const renderContent = () => {
        switch(step.type) {
            case 'greeting': return (
                <div><label>If Interested:</label><textarea value={step.text_yes} onChange={(e) => onUpdate(index, 'text_yes', e.target.value)} /></div>
            );
            case 'qualification': return (
                <div><label>Question:</label><textarea value={step.question} onChange={(e) => onUpdate(index, 'question', e.target.value)} /></div>
            );
            case 'handoff': return (
                <div><label>Specialist Name:</label><input type="text" value={step.specialist_name} onChange={(e) => onUpdate(index, 'specialist_name', e.target.value)} /></div>
            );
            default: return null;
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="funnel-step-card">
            <div className="funnel-step-header">
                <span className="drag-handle" {...attributes} {...listeners}>☰</span>
                <strong className="step-title">{step.title}</strong>
                <button className="delete-step-btn" onClick={() => onDelete(index)}>🗑️</button>
            </div>
            <div className="funnel-step-content">{renderContent()}</div>
        </div>
    );
};

export default function BuildAgentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [funnelSteps, setFunnelSteps] = useState(defaultFunnel);
    const [masterInstructions, setMasterInstructions] = useState("Always be professional...");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user) return;
        const fetchData = async () => {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const docSnap = await getDoc(playbookRef);
            if (docSnap.exists() && docSnap.data().steps) {
                setFunnelSteps(docSnap.data().steps);
            }
        };
        fetchData();
    }, [user]);

    const handleUpdateStep = (index, field, value) => {
        const newSteps = [...funnelSteps];
        newSteps[index][field] = value;
        setFunnelSteps(newSteps);
    };

    const handleDeleteStep = (index) => {
        setFunnelSteps(funnelSteps.filter((_, i) => i !== index));
    };

    const handleAddStep = () => {
        const newStep = { id: Date.now(), type: 'qualification', title: "New Custom Question", question: "" };
        setFunnelSteps([...funnelSteps, newStep]);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setFunnelSteps((items) => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, steps: funnelSteps }, { merge: true });
            
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { masterInstructions: masterInstructions });

            alert("Changes saved!");
        } catch (error) {
            alert("Error saving changes.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="page-title-header">
                <h1>Build My Agent</h1>
                <button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save All Changes'}</button>
            </div>
            <p className="page-subtitle">Design your agent's unique sales process and knowledge.</p>
            
            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                {/* Other tabs can be re-enabled here */}
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        <DndContext sensors={[]} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={funnelSteps} strategy={verticalListSortingStrategy}>
                                {funnelSteps.map((step, index) => (
                                    <SortableStep 
                                        key={step.id} 
                                        step={step} 
                                        index={index}
                                        onUpdate={handleUpdateStep}
                                        onDelete={handleDeleteStep}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                        <div className="add-step-container">
                            <button className="btn btn-outline" onClick={handleAddStep}>+ Add Step</button>
                        </div>
                        <div className="form-card master-instructions">
                            <h3>Master Instructions</h3>
                            <textarea value={masterInstructions} onChange={(e) => setMasterInstructions(e.target.value)} rows="5"></textarea>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}