// src/PropertyDatabasePage.jsx
import './PropertyDatabasePage.css'; // We will create this next
import placeholderImage from './assets/hero-image.png'; // Using hero as a placeholder

export default function PropertyDatabasePage() {
    // Placeholder data
    const properties = [
        { id: 1, price: 'R 1,250,000', specs: '3 Bed | 2 Bath | 2 Garage', address: '123 Main St, Flamwood', status: 'Active', source: 'Property24', image: placeholderImage },
        { id: 2, price: 'R 870,000', specs: '2 Bed | 1 Bath | 1 Garage', address: '456 Oak Ave, Stilfontein', status: 'Active', source: 'Rawson.co.za', image: placeholderImage },
        { id: 3, price: 'R 2,100,000', specs: '4 Bed | 3 Bath | 2 Garage', address: '789 Pine Ln, Klerksdorp Central', status: 'Inactive', source: 'Property24', image: placeholderImage },
    ];

    return (
        <div>
            <div className="page-title-header">
                <h1>Property Database</h1>
                <div className="db-header-actions">
                    <span>Last synced: Today at 8:05 AM</span>
                    <button className="btn btn-outline">Sync Now</button>
                </div>
            </div>
            <p className="page-subtitle">This is a unified view of all listings your AI agent knows about, updated daily.</p>
            
            <div className="db-filters">
                <input type="text" placeholder="Search by address or suburb..." className="filter-search-input" />
                <select className="filter-select"><option>Status: All</option><option>Active</option><option>Inactive</option></select>
                <select className="filter-select"><option>Source: All</option><option>Property24</option><option>Rawson.co.za</option></select>
            </div>

            <div className="property-grid">
                {properties.map(prop => (
                    <div key={prop.id} className="property-card">
                        <div className="property-image" style={{backgroundImage: `url(${prop.image})`}}>
                            <div className={`property-status-tag status-${prop.status.toLowerCase()}`}>{prop.status}</div>
                        </div>
                        <div className="property-content">
                            <p className="property-price">{prop.price}</p>
                            <p className="property-address">{prop.address}</p>
                            <p className="property-specs">{prop.specs}</p>
                            <div className="property-footer">
                                <span className="property-source">{prop.source}</span>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}