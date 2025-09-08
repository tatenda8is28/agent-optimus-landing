// src/BuildAgentPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import './BuildAgentPage.css';

const initialNodes = [
    { id: '1', type: 'input', data: { label: 'Step 1: Trigger & Initial Offer' }, position: { x: 250, y: 5 }, deletable: false },
    { id: '2', data: { label: 'Step 2: Booking Flow' }, position: { x: 250, y: 105 } },
    { id: '3', data: { label: 'Step 3: Qualification Funnel' }, position: { x: 250, y: 205 } },
    { id: '4', data: { label: 'Step 4: Finance Handoff' }, position: { x: 250, y: 305 } },
    { id: '5', type: 'output', data: { label: 'Step 5: Final Transition' }, position: { x: 250, y: 405 }, deletable: false },
];
const initialEdges = [ { id: 'e1-2', source: '1', target: '2' }, { id: 'e2-3', source: '2', target: '3' }, { id: 'e3-4', source: '3', target: '4' }, { id: 'e4-5', source: '4', target: '5' }, ];
const defaultKnowledgeBase = `Common Buyer Questions...\n\nQ: What are transfer costs?\nA: Transfer costs are...`;
const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [personality, setPersonality] = useState(defaultPersonality);
    const [dncList, setDncList] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !userProfile) return;
        setIsLoading(true);
        const fetchData = async () => {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const data = userSnap.data();
                setKnowledgeBase(data.knowledgeDocument || defaultKnowledgeBase);
                setPersonality(data.personality || defaultPersonality);
                setDncList((data.doNotContactList || []).join('\n'));
            }
            // Add logic to fetch and set nodes/edges for playbook later
            setIsLoading(false);
        };
        fetchData();
    }, [user, userProfile]);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), [setEdges]);
    const onNodeClick = (event, node) => alert(`Configuration panel for "${node.data.label}" would open here.`);
    const handlePersonalityChange = (e) => setPersonality(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) }));
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            // Add logic to save nodes/edges (playbook) here
            const userRef = doc(db, 'users', user.uid);
            const dncArray = dncList.split('\n').filter(num => num.trim() !== '');
            await updateDoc(userRef, {
                knowledgeDocument: knowledgeBase,
                personality: personality,
                doNotContactList: dncArray
            });
            alert("Changes saved successfully!");
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
                {activeTab === 'playbook' && (
                    <div className="visual-workflow-builder">
                        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} fitView>
                            <Controls /><Background variant="dots" gap={12} size={1} />
                        </ReactFlow>
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