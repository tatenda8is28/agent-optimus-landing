// src/LeadsPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { DndContext, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './LeadsPage.css';

// --- Reusable Lead Card Component ---
const LeadCard = ({ lead }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="lead-card">
            <p className="lead-name">{lead.name}</p>
            <p className="lead-property">{lead.propertyUrl?.substring(0, 30)}...</p>
        </div>
    );
};

// --- Reusable Kanban Column Component ---
const KanbanColumn = ({ id, title, leads }) => {
    return (
        <div className="kanban-column">
            <h2 className="kanban-column-title">{title} <span>({leads.length})</span></h2>
            <div className="kanban-column-body">
                <SortableContext id={id} items={leads} strategy={verticalListSortingStrategy}>
                    {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
                </SortableContext>
            </div>
        </div>
    );
};

export default function LeadsPage() {
    const { user } = useAuth();
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const columns = ['New Inquiry', 'Contacted', 'Viewing Booked', 'Offer Made'];

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const leadsQuery = query(collection(db, 'leads'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
            const leadsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeads(leadsData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const activeLead = leads.find(l => l.id === active.id);
            if (activeLead && over?.id) {
                // Update the status in Firestore
                const leadRef = doc(db, 'leads', active.id);
                await updateDoc(leadRef, { status: over.id });
                // The onSnapshot listener will handle the UI update automatically
            }
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
                            key={columnId}
                            id={columnId}
                            title={columnId}
                            leads={leads.filter(lead => lead.status === columnId)}
                        />
                    ))}
                </div>
            </DndContext>
        </div>
    );
}