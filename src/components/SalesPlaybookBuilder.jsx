// src/components/SalesPlaybookBuilder.jsx
import { useState, useCallback, useEffect } from 'react';
import ReactFlow, { ReactFlowProvider, Controls, Background, applyNodeChanges, applyEdgeChanges, addEdge, useReactFlow, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import '../BuildAgentPage.css';

const initialNodes = [
    { id: '1', type: 'input', data: { label: 'Message Received on WhatsApp' }, position: { x: 250, y: 0 } },
    { id: '2', data: { label: 'BotManager: Multi-Tenant Router' }, position: { x: 250, y: 100 } },
    { id: '3', data: { label: 'Identify Tenant by Number' }, position: { x: 250, y: 200 } },
    { id: '4', data: { label: 'Fetch Tenant Config (from Firebase)' }, position: { x: 250, y: 300 } },
    { id: '5', data: { label: 'MainAgent: Intent Dispatcher' }, position: { x: 250, y: 400 } },
    { id: '6', type: 'default', data: { label: 'Determine User Intent' }, position: { x: 250, y: 500 } },
    { id: '7', data: { label: 'PropertyAgent' }, position: { x: 50, y: 625 } },
    { id: '8', data: { label: 'LeadAgent' }, position: { x: 250, y: 625 } },
    { id: '9', data: { label: 'BookingAgent' }, position: { x: 450, y: 625 } },
    { id: '10', type: 'output', data: { label: 'Formulate & Send Reply' }, position: { x: 250, y: 750 } },
];
const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e2-3', source: '2', target: '3', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e3-4', source: '3', target: '4', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e4-5', source: '4', target: '5', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e5-6', source: '5', target: '6', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e6-7', source: '6', target: '7', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, label: 'Search' },
    { id: 'e6-8', source: '6', target: '8', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, label: 'New Lead' },
    { id: 'e6-9', source: '6', target: '9', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed }, label: 'Booking' },
    { id: 'e7-10', source: '7', target: '10', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e8-10', source: '8', target: '10', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
    { id: 'e9-10', source: '9', target: '10', type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } },
];

const SidePanel = ({ node, onSave, onClose }) => {
    const [content, setContent] = useState(node.data.content || '');
    useEffect(() => { setContent(node.data.content || ''); }, [node]);
    return ( <aside className="side-panel"><div className="side-panel-header"><h3>Editing: {node.data.label}</h3><button onClick={onClose} className="close-panel-btn">&times;</button></div><div className="side-panel-content"><textarea value={content} onChange={(e) => setContent(e.target.value)} rows="10" /><button className="btn btn-primary" onClick={() => onSave(node.id, content)}>Apply Changes</button></div></aside> );
};

const NodesPanel = ({ onDragStart }) => (
    <aside className="nodes-panel">
        <h3>Building Blocks</h3><h4>Triggers</h4>
        <div className="node-item trigger" onDragStart={(event) => onDragStart(event, 'input')} draggable>▶️ On New Lead</div>
        <h4>Actions</h4>
        <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>💬 Send Message</div>
        <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>❓ Ask a Question</div>
        <div className="node-item" onDragStart={(event) => onDragStart(event, 'default')} draggable>🔔 Send Notification</div>
        <h4>Logic</h4>
        <div className="node-item logic" onDragStart={(event) => onDragStart(event, 'default')} draggable>🔀 Add Condition</div>
    </aside>
);

const SalesPlaybookBuilder = ({ playbookData, onPlaybookChange }) => {
    const [nodes, setNodes] = useState(playbookData.nodes && playbookData.nodes.length > 0 ? playbookData.nodes : initialNodes);
    const [edges, setEdges] = useState(playbookData.edges && playbookData.edges.length > 0 ? playbookData.edges : initialEdges);
    const [selectedNode, setSelectedNode] = useState(null);
    const reactFlowInstance = useReactFlow();

    useEffect(() => { onPlaybookChange({ nodes, edges }); }, [nodes, edges, onPlaybookChange]);

    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => setEdges((eds) => addEdge({ ...connection, animated: true, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed } }, eds)), []);
    
    const handleNodeClick = (event, node) => setSelectedNode(node);
    const handleNodeSave = (nodeId, newContent) => {
        const newNodes = nodes.map(node => node.id === nodeId ? { ...node, data: { ...node.data, content: newContent }} : node);
        setNodes(newNodes);
        setSelectedNode(null);
    };

    const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
    const onDrop = useCallback((event) => {
        event.preventDefault();
        const type = event.dataTransfer.getData('application/reactflow');
        if (!type || !reactFlowInstance) return;
        const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const newNode = { id: `dndnode_${Date.now()}`, type, position, data: { label: `New ${type} Step` } };
        setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, nodes]);

    return (
        <div className="visual-workflow-container">
            <NodesPanel onDragStart={(event, nodeType) => event.dataTransfer.setData('application/reactflow', nodeType)} />
            <div className="visual-workflow-builder" onDrop={onDrop} onDragOver={onDragOver}>
                <ReactFlow
                    nodes={nodes} edges={edges}
                    onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                    onConnect={onConnect} onNodeClick={handleNodeClick} onInit={(instance) => setReactFlowInstance(instance)}
                    fitView
                    deleteKeyCode={['Backspace', 'Delete']}
                >
                    <Controls /><Background variant="dots" />
                </ReactFlow>
            </div>
            {selectedNode && <SidePanel node={selectedNode} onSave={handleNodeSave} onClose={() => setSelectedNode(null)} />}
        </div>
    );
};

export const WrappedSalesPlaybookBuilder = (props) => (
    <ReactFlowProvider>
        <SalesPlaybookBuilder {...props} />
    </ReactFlowProvider>
);