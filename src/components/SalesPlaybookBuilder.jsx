// src/components/SalesPlaybookBuilder.jsx
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, { Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import '../BuildAgentPage.css';

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Step 1: Trigger & Initial Offer', content: "Initial offer text..." }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Step 2: Booking Flow', content: "Booking flow text..." }, position: { x: 250, y: 125 } },
];
const initialEdges = [ { id: 'e1-2', source: '1', target: '2', animated: true } ];

const SidePanel = ({ node, onSave, onClose }) => {
    const [content, setContent] = useState(node.data.content || '');

    useEffect(() => {
        setContent(node.data.content || '');
    }, [node]);

    const handleSave = () => {
        onSave(node.id, content);
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
                <button className="btn btn-primary" onClick={handleSave}>Apply Changes</button>
            </div>
        </aside>
    );
};

export const SalesPlaybookBuilder = ({ playbookData, onPlaybookChange }) => {
    const [nodes, setNodes] = useState(playbookData.nodes || initialNodes);
    const [edges, setEdges] = useState(playbookData.edges || initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);

    useEffect(() => {
        // Update parent state whenever nodes or edges change
        onPlaybookChange({ nodes, edges });
    }, [nodes, edges, onPlaybookChange]);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);
    
    const handleNodeClick = (event, node) => setSelectedNode(node);
    const handleNodeSave = (nodeId, newContent) => {
        setNodes((nds) => nds.map(node => node.id === nodeId ? { ...node, data: { ...node.data, content: newContent }} : node));
        setSelectedNode(null); // Close panel after save
    };
    
    return (
        <div className="visual-workflow-container">
            <div className="visual-workflow-builder">
                <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={handleNodeClick} fitView>
                    <Controls /><Background variant="dots" />
                </ReactFlow>
            </div>
            {selectedNode && <SidePanel node={selectedNode} onSave={handleNodeSave} onClose={() => setSelectedNode(null)} />}
        </div>
    );
};