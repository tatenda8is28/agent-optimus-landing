// src/PropertyDatabasePage.jsx
import { useState } from 'react';
import './PropertyDatabasePage.css';
import placeholderImage from './assets/hero-image.png';

// --- NEW MODAL COMPONENT ---
const Modal = ({ children, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
            {children}
        </div>
    </div>
);

export default function PropertyDatabasePage() {
    // State to control the modals
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Placeholder data
    const properties = [
        { id: 1, price: 'R 1,250,000', specs: '3 Bed | 2 Bath', address: '123 Main St, Flamwood', status: 'Active', source: 'Property24', image: placeholderImage },
        { id: 2, price: 'R 870,000', specs: '2 Bed | 1 Bath', address: '456 Oak Ave, Stilfontein', status: 'Active', source: 'Rawson.co.za', image: placeholderImage },
        { id: 3, price: 'R 2,100,000', specs: '4 Bed | 3 Bath', address: '789 Pine Ln, Klerksdorp', status: 'Inactive', source: 'Property24', image: placeholderImage },
    ];

    return (
        <div>
            {/* --- REVISED HEADER WITH NEW BUTTONS --- */}
            <div className="page-title-header">
                <h1>Property Database</h1>
                <div className="db-header-actions">
                    <button className="btn btn-outline" onClick={() => alert('Exporting CSV...')}>📤 Export CSV</button>
                    <button className="btn btn-primary" onClick={() => setIsImportModalOpen(true)}>📥 Import CSV</button>
                </div>
            </div>
            <p className="page-subtitle">Manage your listings via CSV or add individual properties manually.</p>
            
            <div className="db-filters">
                <input type="text" placeholder="Search by address or suburb..." className="filter-search-input" />
                <select className="filter-select"><option>Status: All</option></select>
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Property</button>
            </div>

            <div className="property-grid">
                {properties.map(prop => (
                    <div key={prop.id} className="property-card">
                        {/* ... property card jsx from previous step ... */}
                        <div className="property-image" style={{backgroundImage: `url(${prop.image})`}}>
                            <div className={`property-status-tag status-${prop.status?.toLowerCase()}`}>{prop.status}</div>
                             <div className="property-menu">
                                <button>⋮</button>
                                <div className="menu-dropdown">
                                    <a href="#">✏️ Edit</a>
                                    <a href="#">🗑️ Delete</a>
                                </div>
                            </div>
                        </div>
                        <div className="property-content">
                            <p className="property-price">{prop.price}</p>
                            <p className="property-address">{prop.address}</p>
                            <p className="property-specs">{prop.specs}</p>
                            <div className="property-footer">
                                <span className="property-source">{prop.source}</span>
                                <label className="switch-label">Visible to AI</label>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked={prop.status === 'Active'} />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- NEW MODALS FOR CSV IMPORT AND ADDING PROPERTY --- */}
            {isImportModalOpen && (
                <Modal onClose={() => setIsImportModalOpen(false)}>
                    <h2>Import Properties from CSV</h2>
                    <p>Upload a CSV file with your listings. The columns must match the provided template to ensure a successful import.</p>
                    <a href="/property-template.csv" download className="template-link">Download Template CSV</a>
                    <div className="file-drop-zone" style={{marginTop: '16px'}}>Drag & Drop your CSV file here</div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary">Preview & Confirm</button>
                    </div>
                </Modal>
            )}

            {isAddModalOpen && (
                <Modal onClose={() => setIsAddModalOpen(false)}>
                    <h2>Add New "Pocket" Listing</h2>
                    <p>Manually add a new property that is not listed on a portal.</p>
                    <div className="wizard-form-group"><label>Price</label><input type="text" placeholder="e.g. R 1,500,000" /></div>
                    <div className="wizard-form-group"><label>Address</label><input type="text" placeholder="e.g. 123 Main St, Flamwood" /></div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary">Save Property</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}