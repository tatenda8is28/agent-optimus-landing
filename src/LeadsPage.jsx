// src/LeadsPage.jsx

import './LeadsPage.css'; // We will create this next

export default function LeadsPage() {
    // Placeholder data
    const columns = {
        'New Inquiry': [{id: 1, name: 'John Doe', property: '123 Main St'}],
        'Contacted': [{id: 2, name: 'Jane Smith', property: '456 Oak Ave'}],
        'Viewing Booked': [],
        'Offer Made': [{id: 3, name: 'Sam Wilson', property: '789 Pine Ln'}],
    };

    return (
        <div>
            <div className="page-title-header">
                <h1>Leads</h1>
                <button className="btn btn-primary">Add New Lead</button>
            </div>
            <div className="kanban-board">
                {Object.entries(columns).map(([title, leads]) => (
                    <div key={title} className="kanban-column">
                        <h2 className="kanban-column-title">{title} <span>({leads.length})</span></h2>
                        <div className="kanban-column-body">
                            {leads.map(lead => (
                                <div key={lead.id} className="lead-card">
                                    <p className="lead-name">{lead.name}</p>
                                    <p className="lead-property">{lead.property}</p>
                                </div>
                            ))}
                            {leads.length === 0 && <div className="lead-card-placeholder">No leads in this stage</div>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}