// src/BuildAgentPage.jsx (FINAL, FUNCTIONAL VERSION)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import './BuildAgentPage.css';

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Step 1: Trigger & Initial Offer', content: "Initial offer text..." }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Step 2: Booking Flow', content: "Booking flow text..." }, position: { x: 250, y: 125 } },
  { id: '3', data: { label: 'Step 3: Qualification', content: "Qualification text..." }, position: { x: 250, y: 245 } },
];
const initialEdges = [ { id: 'e1-2', source: '1', target: '2', animated: true }, { id: 'e2-3', source: '2', target: '3', animated: true } ];

// --- NEW Side Panel for Editing Node Content ---
const SidePanel = ({ node, onSave, onClose }) => {
    const [content, setContent] = useState(node.data.content || '');

    const handleSave = () => {
        onSave(node.id, content);
        onClose();
    };

    return (
        <aside className="side-panel">
            <div className="side-panel-header">
                <h3>Editing: {node.data.label}</h3>
                <button onClick={onClose} className="close-panel-btn">&times;</button>
            </div>
            <div className="side-panel-content">
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="10"
                />
                <button className="btn btn-primary" onClick={handleSave}>Save Step</button>
            </div>
        </aside>
    );
};


export default function BuildAgentPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('playbook');
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // --- NEW: State for the side panel ---
    const [selectedNode, setSelectedNode] = useState(null);

    // --- Fetch playbook data from Firestore ---
    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const playbookRef = doc(db, 'sales_playbooks', user.uid);
        getDoc(playbookRef).then((docSnap) => {
            if (docSnap.exists() && docSnap.data().nodes) {
                setNodes(docSnap.data().nodes);
                setEdges(docSnap.data().edges);
            } else {
                // If no playbook exists, set the default template
                setNodes(initialNodes);
                setEdges(initialEdges);
            }
            setIsLoading(false);
        });
    }, [user]);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);

    // --- Open the side panel when a node is clicked ---
    const handleNodeClick = (event, node) => {
        setSelectedNode(node);
    };

    // --- Update the content of a node ---
    const handleNodeSave = (nodeId, newContent) => {
        setNodes((nds) => nds.map(node => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, content: newContent }};
            }
            return node;
        }));
    };

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const playbookRef = doc(db, 'sales_playbooks', user.uid);
            await setDoc(playbookRef, {
                agentId: user.uid,
                nodes: nodes,
                edges: edges
            }, { merge: true });
            alert("Workflow saved successfully!");
        } catch (error) {
            console.error("Error saving workflow:", error);
            alert("Failed to save workflow.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div style={{padding: '40px'}}>Loading Workflow Builder...</div>;

    return (
        <div>
            <div className="page-title-header"><h1>Build My Agent</h1><button className="btn btn-primary" onClick={handleSaveChanges} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Workflow'}</button></div>
            <p className="page-subtitle">Design your agent's visual sales process. Drag to rearrange, click to configure.</p>
            
            <div className="build-agent-tabs">
                <button className={activeTab === 'playbook' ? 'active' : ''}>Sales Playbook</button>
                {/* Other tabs are disabled for this sprint */}
            </div>

            <div className="tab-content-wrapper">
                <div className="visual-workflow-container">
                    <div className="visual-workflow-builder">
                        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={handleNodeClick} fitView>
                            <Controls /><Background variant="dots" />
                        </ReactFlow>
                    </div>
                    {/* --- NEW: Render the side panel when a node is selected --- */}
                    {selectedNode && <SidePanel node={selectedNode} onSave={handleNodeSave} onClose={() => setSelectedNode(null)} />}
                </div>
            </div>
        </div>
    );
}