// src/components/PipelineView.jsx
import React, { useState, useMemo } from 'react';

export const PipelineView = ({ leads, onSelectLead }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    const filteredLeads = useMemo(() => {
        return leads.filter(lead => {
            const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
            const matchesSearch = searchTerm === '' || 
                lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lead.email?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [leads, searchTerm, statusFilter]);

    return (
        <div className="pipeline-view">
            <div className="pipeline-controls">
                <input 
                    type="text" 
                    placeholder="Search leads..." 
                    className="filter-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="New Inquiry">New Inquiry</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Viewing Booked">Viewing Booked</option>
                    <option value="Offer Made">Offer Made</option>
                </select>
            </div>
            <div className="table-wrapper">
                <table className="leads-table">
                    <thead>
                        <tr>
                            <th>Lead</th>
                            <th>Status</th>
                            <th>Last Contact</th>
                            <th>Timeline</th>
                            <th>Finance</th>
                            <th>Preference</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.map(lead => (
                            <tr key={lead.id} onClick={() => onSelectLead(lead)}>
                                <td>
                                    <div className="lead-name-cell">{lead.name}</div>
                                    <div className="lead-contact-cell">{lead.contact}</div>
                                </td>
                                <td><span className={`status-pill status-${lead.status?.replace(' ', '-')}`}>{lead.status}</span></td>
                                <td>{lead.createdAt?.toDate().toLocaleDateString()}</td>
                                <td>{lead.timeline || '--'}</td>
                                <td>{lead.financial_position || '--'}</td>
                                <td className="preference-cell">{lead.preferences || '--'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};