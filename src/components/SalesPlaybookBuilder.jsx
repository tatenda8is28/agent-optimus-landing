// src/components/SalesPlaybookBuilder.jsx
import { useState, useCallback } from 'react';
import ReactFlow, { ReactFlowProvider, Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import '../BuildAgentPage.css';

const initialNodes = [
  { id: '1', type: 'input', data: { label: 'Start: New Lead Inquiry' }, position: { x: 50, y: 5 } },
  { id: '2', data: { label: 'Message 1: Initial Offer' }, position: { x: 50, y: 125 } },
];
const initialEdges = [ { id: 'e1-2', source: '1', target: '2', animated: true } ];

const SidePanel = ({ node, onSave, onClose }) => {
    const [content, setContent] = useState(node.data.content || '');
    return (
        <aside className="side-panel">
            <div className="side-panel-header"><h3>Editing: {node.data.label}</h3><button onClick={onClose}>&times;</button></div>
            <div className="side-panel-content">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="10" />
                <button className="btn btn-primary" onClick={() => onSave(node.id, content)}>Apply Changes</button>
            </div>
        </aside>
    );
};

const NodesPanel = ({ onDragStart }) => (
    <aside className="nodes-panel">
        <h3>Building Blocks</h3>
        <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>💬 Send Message</div>
        <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>❓ Ask Question</div>
        <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>🔀 Add Condition</div>
    </aside>
);

export const SalesPlaybookBuilder = ({ playbookData, onPlaybookChange }) => {
    const [nodes, setNodes] = useState(playbookData.nodes || initialNodes);
    const [edges, setEdges] = useState(playbookData.edges || initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge(connection, eds)), []);
    
    const handleNodeClick = (event, node) => setSelectedNode(node);
    const handleNodeSave = (nodeId, newContent) => {
        const newNodes = nodes.map(node => node.id === nodeId ? { ...node, data: { ...node.data, content: newContent }} : node);
        setNodes(newNodes);
        onPlaybookChange({ nodes: newNodes, edges });
        setSelectedNode(null);
    };

    const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type) return;
        const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNode = { id: `dndnode_${Date.now()}`, type, position, data: { label: `New ${type} Step` } };
        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        onPlaybookChange({ nodes: newNodes, edges });
    }, [reactFlowInstance, nodes, edges]);

    return (
        <ReactFlowProvider>
            <div className="visual-workflow-container">
                <NodesPanel onDragStart={(event, nodeType) => event.dataTransfer.setData('application/reactflow', nodeType)} />
                <div className="visual-workflow-builder" onDrop={onDrop} onDragOver={onDragOver}>
                    <ReactFlow
                        nodes={nodes} edges={edges} onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange} onConnect={onConnect}
                        onNodeClick={handleNodeClick} onInit={setReactFlowInstance} fitView
                    >
                        <Controls /><Background variant="dots" />
                    </ReactFlow>
                </div>
                {selectedNode && <SidePanel node={selectedNode} onSave={handleNodeSave} onClose={() => setSelectedNode(null)} />}
            </div>
        </ReactFlowProvider>
    );
};