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
    { id: 1, type: 'greeting', title: "Step 1: Greeting & Hook", text_yes: "Great! When would suit you best...", text_no: "No problem, may I ask..." },
    { id: 2, type: 'qualification', title: "Step 2: Qualification", question: "How soon are you looking to purchase?" },
    { id: 3, type: 'handoff', title: "Step 3: Finance Handoff", enabled: true, specialist_name: "Adel" }
];
const defaultMasterInstructions = "Always be professional and helpful. If you don't know an answer, say you will ask the agent.";

const SortableStep = ({ step, index, onUpdate, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    const renderContent = () => {
        switch(step.type) {
            case 'greeting': return (
                <div>
                    <label>If Interested:</label>
                    <textarea value={step.text_yes} onChange={(e) => onUpdate(index, 'text_yes', e.target.value)} rows="3" />
                    <label style={{marginTop: '16px'}}>If Not Interested:</label>
                    <textarea value={step.text_no} onChange={(e) => onUpdate(index, 'text_no', e.target.value)} rows="2" />
                </div>
            );
            case 'qualification': return (
                <div>
                    <label>Question:</label>
                    <textarea value={step.question} onChange={(e) => onUpdate(index, 'question', e.target.value)} rows="2" />
                </div>
            );
            case 'handoff': return (
                <div>
                    <label>Specialist Name:</label>
                    <input type="text" value={step.specialist_name} onChange={(e) => onUpdate(index, 'specialist_name', e.target.value)} />
                </div>
            );
            default: return <p>Unknown step type. Please delete and recreate.</p>;
        }
    };

    return (
        <div ref={setNodeRef} style={style} className="funnel-step-card">
            <div className="funnel-step-header">
                <span className="drag-handle" {...attributes} {...listeners}>☰</span>
                <strong className="step-title">{step.title}</strong>
                <button className="delete-step-btn" onClick={() => onDelete(index)} title="Delete Step">🗑️</button>
            </div>
            <div className="funnel-step-content">{renderContent()}</div>
        </div>
    );
};

export default function BuildAgentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [funnelSteps, setFunnelSteps] = useState([]);
    const [masterInstructions, setMasterInstructions] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 10 } }));

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const fetchData = async () => {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            const userRef = doc(db, 'users', user.uid);
            const [playbookSnap, userSnap] = await Promise.all([getDoc(playbookRef), getDoc(userRef)]);
            
            if (playbookSnap.exists() && playbookSnap.data().steps) {
                setFunnelSteps(playbookSnap.data().steps);
            } else {
                setFunnelSteps(defaultFunnel);
            }
            if (userSnap.exists() && userSnap.data().masterInstructions) {
                setMasterInstructions(userSnap.data().masterInstructions);
            } else {
                setMasterInstructions(defaultMasterInstructions);
            }
            setIsLoading(false);
        };
        fetchData();
    }, [user]);

    const handleUpdateStep = (index, field, value) => {
        const newSteps = [...funnelSteps];
        newSteps[index][field] = value;
        setFunnelSteps(newSteps);
    };

    const handleDeleteStep = (index) => {
        if (window.confirm("Are you sure you want to delete this step?")) {
            setFunnelSteps(funnelSteps.filter((_, i) => i !== index));
        }
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

            alert("All changes have been saved successfully!");
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("An error occurred while saving. Please try again.");
        } finally {
            setIsSaving(false);
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
            <p className="page-subtitle">Design your agent's unique sales process and knowledge.</p>
            
            <div className="build-agent-tabs">
                <button onClick={() => setActiveTab('playbook')} className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                <button onClick={() => setActiveTab('knowledge')} className={activeTab === 'knowledge' ? 'active' : ''}>Knowledge Base</button>
                {/* Other tabs can be added back here */}
            </div>

            <div className="tab-content-wrapper">
                {activeTab === 'playbook' && (
                    <div className="tab-content">
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                            <button className="btn btn-outline" onClick={handleAddStep}>+ Add New Step</button>
                        </div>
                        <div className="form-card master-instructions">
                            <h3>Master Instructions</h3>
                            <textarea value={masterInstructions} onChange={(e) => setMasterInstructions(e.target.value)} rows="5"></textarea>
                        </div>
                    </div>
                )}
                {activeTab === 'knowledge' && (
                    <div className="tab-content">
                        {/* Knowledge Base UI will go here */}
                        <p>Knowledge base editor coming soon.</p>
                    </div>
                )}
            </div>
        </div>
    );
}