// src/LeadsPage.jsx (FINAL, DATA-RICH VERSION)
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LeadsPage.css';

// --- NEW "DRILL-DOWN" MODAL COMPONENT ---
const LeadDetailModal = ({ lead, onClose }) => {
    if (!lead) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content lead-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>
                <div className="lead-modal-grid">
                    <div className="lead-profile-section">
                        <h2>Lead Profile</h2>
                        <p><strong>Name:</strong> {lead.name}</p>
                        <p><strong>Contact:</strong> {lead.contact}</p>
                        <p><strong>Email:</strong> {lead.email || 'N/A'}</p>
                        <p><strong>Property URL:</strong> <a href={lead.propertyUrl} target="_blank" rel="noopener noreferrer">View Listing</a></p>
                        <hr />
                        <h3>Qualification</h3>
                        <p><strong>Timeline:</strong> {lead.timeline || 'N/A'}</p>
                        <p><strong>Finance:</strong> {lead.financial_position || 'N/A'}</p>
                        <p><strong>Preferences:</strong> {lead.preferences || 'N/A'}</p>
                    </div>
                    <div className="conversation-log-section">
                        <h2>Conversation Log</h2>
                        <div className="conversation-log">
                            {lead.conversation?.map((msg, index) => (
                                <div key={index} className={`chat-bubble ${msg.role}`}>
                                    {msg.content}
                                    <span className="chat-timestamp">{msg.timestamp?.toDate().toLocaleTimeString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- UPDATED, DATA-RICH LEAD CARD COMPONENT ---
const LeadCard = ({ lead, onClick }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    
    return (
        // Added onClick to the div that is NOT being dragged
        <div ref={setNodeRef} style={style} className="lead-card-wrapper">
            <div className="lead-card" onClick={onClick} {...attributes} {...listeners}>
                <p className="lead-name">{lead.name}</p>
                <div className="lead-details">
                    <p><strong>Finance:</strong> {lead.financial_position || '...'}</p>
                    <p><strong>Timeline:</strong> {lead.timeline || '...'}</p>
                </div>
            </div>
        </div>
    );
};

const KanbanColumn = ({ id, title, leads, onCardClick }) => (
    <div className="kanban-column">
        <h2 className="kanban-column-title">{title} <span>({leads.length})</span></h2>
        <div className="kanban-column-body">
            <SortableContext id={id} items={leads} strategy={verticalListSortingStrategy}>
                {leads.map(lead => <LeadCard key={lead.id} lead={lead} onClick={() => onCardClick(lead)} />)}
            </SortableContext>
        </div>
    </div>
);

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null); // State for the modal

    const columns = ['New Inquiry', 'Contacted', 'Viewing Booked', 'Offer Made'];

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            leadsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setLeads(leadsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over?.id && over?.id) {
            const leadRef = doc(db, 'leads', active.id);
            await updateDoc(leadRef, { status: over.id });
        }
    };
    
    if (isLoading) return <div style={{padding: '40px'}}>Loading leads...</div>;

    return (
        <div>
            <div className="page-title-header"><h1>Leads</h1><button className="btn btn-primary">Add New Lead</button></div>
            <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                <div className="kanban-board">
                    {columns.map(columnId => (
                        <KanbanColumn
                            key={columnId} id={columnId} title={columnId}
                            leads={leads.filter(lead => lead.status === columnId)}
                            onCardClick={(lead) => setSelectedLead(lead)}
                        />
                    ))}
                </div>
            </DndContext>
            <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
        </div>
    );
}