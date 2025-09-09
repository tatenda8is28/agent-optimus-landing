// src/BuildAgentPage.jsx (FINAL, STABLE VERSION)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import './BuildAgentPage.css';

const initialNodes = [ { id: '1', type: 'input', data: { label: 'Step 1: Trigger & Initial Offer' }, position: { x: 250, y: 5 } }, { id: '2', data: { label: 'Step 2: Booking Flow' }, position: { x: 250, y: 125 } }, ];
const initialEdges = [ { id: 'e1-2', source: '1', target: '2', animated: true } ];
const defaultKnowledgeBase = `Common Buyer Questions...\n\nQ: What are transfer costs?\nA: Transfer costs are...`;
const defaultPersonality = { professionalism: 0.5, enthusiasm: 0.5 };

const SidePanel = ({ node, onSave, onClose }) => {
    const [content, setContent] = useState(node.data.content || '');
    useEffect(() => { setContent(node.data.content || ''); }, [node]);
    const handleSave = () => { onSave(node.id, content); };
    return ( <aside className="side-panel"><div className="side-panel-header"><h3>Editing: {node.data.label}</h3><button onClick={onClose} className="close-panel-btn">&times;</button></div><div className="side-panel-content"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows="10" /><button className="btn btn-primary" onClick={handleSave}>Apply Changes</button></div></aside> );
};

export default function BuildAgentPage() {
    const { user, userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [knowledgeBase, setKnowledgeBase] = useState("");
    const [personality, setPersonality] = useState(defaultPersonality);
    const [dncList, setDncList] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        if (!user || !userProfile) {
            setIsLoading(false); // <-- CRITICAL FIX: Stop loading if no user
            return;
        }
        setIsLoading(true);
        const playbookRef = doc(db, 'sales_playbooks', user.uid);
        const userRef = doc(db, 'users', user.uid);
        Promise.all([getDoc(playbookRef), getDoc(userRef)]).then(([playbookSnap, userSnap]) => {
            if (playbookSnap.exists() && playbookSnap.data().nodes) {
                setNodes(playbookSnap.data().nodes);
                setEdges(playbookSnap.data().edges || []);
            } else {
                setNodes(initialNodes);
                setEdges(initialEdges);
            }
            if (userSnap.exists()) {
                const data = userSnap.data();
                setKnowledgeBase(data.knowledgeDocument || defaultKnowledgeBase);
                setPersonality(data.personality || defaultPersonality);
                setDncList((data.doNotContactList || []).join('\n'));
            }
            setIsLoading(false);
        }).catch(err => {
            console.error("Error fetching data:", err);
            setIsLoading(false); // Stop loading on error
        });
    }, [user, userProfile]);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);
    const handleNodeClick = (event, node) => setSelectedNode(node);
    const handleNodeSave = (nodeId, newContent) => { setNodes((nds) => nds.map(node => node.id === nodeId ? { ...node, data: { ...node.data, content: newContent }} : node)); setSelectedNode(null); };
    const handlePersonalityChange = (e) => setPersonality(prev => ({ ...prev, [e.target.name]: parseFloat(e.target.value) }));
    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, { agentId: user.uid, nodes, edges }, { merge: true });
            const userRef = doc(db, 'users', user.uid);
            const dncArray = dncList.split('\n').filter(num => num.trim() !== '');
            await updateDoc(userRef, { knowledgeDocument: knowledgeBase, personality, doNotContactList: dncArray });
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
                    <div className="visual-workflow-container">
                        <div className="visual-workflow-builder">
                            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={handleNodeClick} fitView><Controls /><Background variant="dots" /></ReactFlow>
                        </div>
                        {selectedNode && <SidePanel node={selectedNode} onSave={handleNodeSave} onClose={() => setSelectedNode(null)} />}
                    </div>
                )}
                {activeTab === 'knowledge' && ( <div className="tab-content"><h2>The Brain: Your Agent's Knowledge</h2><div className="knowledge-editor"><textarea value={knowledgeBase} onChange={(e) => setKnowledgeBase(e.target.value)} rows="20"></textarea></div></div> )}
                {activeTab === 'personality' && ( <div className="tab-content"><h2>The Vibe: Define your agent's personality</h2><div className="form-card"><label>Professionalism</label><input type="range" name="professionalism" min="0" max="1" step="0.1" value={personality.professionalism} onChange={handlePersonalityChange} className="personality-slider" /><div className="slider-labels"><span>Casual & Friendly</span><span>Formal & Direct</span></div></div><div className="form-card"><label>Enthusiasm</label><input type="range" name="enthusiasm" min="0" max="1" step="0.1" value={personality.enthusiasm} onChange={handlePersonalityChange} className="personality-slider" /><div className="slider-labels"><span>Calm & Concise</span><span>Eager & Expressive</span></div></div></div> )}
                {activeTab === 'dnc' && ( <div className="tab-content"><h2>Do Not Contact List</h2><div className="form-card"><label htmlFor="dnc-list">Enter one WhatsApp number per line</label><textarea id="dnc-list" className="dnc-textarea" value={dncList} onChange={(e) => setDncList(e.target.value)} placeholder="e.g. +27821234567&#10;+27831234568" rows="10"></textarea></div></div> )}
            </div>
        </div>
    );
}