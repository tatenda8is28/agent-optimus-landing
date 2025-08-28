// src/CompanyInfoPage.jsx
export default function CompanyInfoPage() {
    return (
        <div>
            <div className="page-title-header">
                <h1>Company Info</h1>
                <button className="btn btn-primary">Save Changes</button>
            </div>
            <p className="page-subtitle">Manage your core business details and connect your property data.</p>
            <div className="form-card">
                <h3>Business Details</h3>
                <div className="wizard-form-group"><label>Company Name</label><input type="text" defaultValue="Rawson Properties" /></div>
                <div className="wizard-form-group"><label>Primary Service Area(s)</label><input type="text" defaultValue="Klerksdorp, Flamwood" /></div>
            </div>
            <div className="form-card">
                <h3>Property Database Connection</h3>
                <div className="wizard-form-group"><label>Live Sync URL (Property24, etc.)</label><input type="url" /></div>
                <p style={{textAlign: 'center', margin: '16px 0', color: 'var(--ink-light)'}}>OR</p>
                <div className="wizard-form-group"><label>Manual Upload (CSV or Excel)</label><div className="file-drop-zone">Upload Property File</div></div>
            </div>
        </div>
    );
}