// src/PropertyDatabasePage.jsx (FINAL, WITH SEARCH AND COUNTS)
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { db, functions } from './firebaseClient';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import './PropertyDatabasePage.css';
import placeholderImage from './assets/hero-image.png';

const getPropertySpecs = (prop) => {
    if (prop.specs) return prop.specs;
    const parts = [];
    if (prop.bedrooms) parts.push(`${prop.bedrooms} Bed`);
    if (prop.bathrooms) parts.push(`${prop.bathrooms} Bath`);
    if (prop.garages) parts.push(`${prop.garages} Garage`);
    return parts.join(' | ');
};

const Modal = ({ children, onClose }) => ( <div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={(e) => e.stopPropagation()}><button className="modal-close-btn" onClick={onClose}>&times;</button>{children}</div></div> );

export default function PropertyDatabasePage() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newProperty, setNewProperty] = useState({ price: '', address: '', specs: '', imageUrl: '' });
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!user) { setIsLoading(false); return; }
        setIsLoading(true);
        const propertiesQuery = query(collection(db, 'properties'), where('agentId', '==', user.uid));
        const unsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            propsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setProperties(propsData);
            setIsLoading(false);
        }, (error) => { console.error("Error fetching properties:", error); setIsLoading(false); });
        return () => unsubscribe();
    }, [user]);

    const filteredProperties = useMemo(() => {
        if (!searchTerm) {
            return properties;
        }
        return properties.filter(prop => 
            prop.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prop.suburb?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [properties, searchTerm]);

    const handleNewPropertyChange = (e) => { const { name, value } = e.target; setNewProperty(prev => ({ ...prev, [name]: value })); };

    const handleAddPocketListing = async () => {
        if (!user || !newProperty.price || !newProperty.address) { alert("Price and Address are required."); return; }
        setIsUploading(true);
        try {
            await addDoc(collection(db, 'properties'), { agentId: user.uid, price: parseInt(newProperty.price.replace(/[^0-9]/g, '')) || 0, address: newProperty.address, specs: newProperty.specs, imageUrl: newProperty.imageUrl, source: 'Manual Entry', status: 'Active', isAiEnabled: true, createdAt: serverTimestamp(), lastEditedBy: 'agent' });
            setNewProperty({ price: '', address: '', specs: '', imageUrl: '' });
            setIsAddModalOpen(false);
        } catch (error) { console.error("Error adding new property:", error); alert(`Failed to add property: ${error.message}`);
        } finally { setIsUploading(false); }
    };
    
    const handleFileSelect = (e) => { if (e.target.files && e.target.files[0]) { if (e.target.files[0].type !== "text/csv") { alert("Please select a valid .csv file."); e.target.value = null; return; } setCsvFile(e.target.files[0]); } };

    const handleCsvImport = async () => {
        if (!user || !csvFile) { alert("Please select a CSV file to import."); return; }
        setIsUploading(true);
        try {
            const reader = new FileReader();
            reader.readAsDataURL(csvFile);
            reader.onload = async () => {
                const base64Content = reader.result.split(',')[1];
                const uploadPropertyCSV = httpsCallable(functions, 'uploadPropertyCSV');
                await uploadPropertyCSV({ fileName: csvFile.name, fileContent: base64Content });
                alert("Upload and processing complete! Your properties should now be visible.");
                setCsvFile(null);
                setIsImportModalOpen(false);
                setIsUploading(false);
            };
            reader.onerror = () => { throw new Error("Failed to read file."); };
        } catch(error) {
            console.error("Error calling upload function:", error);
            alert(`File processing failed: ${error.message}`);
            setIsUploading(false);
        }
    };

    return (
        <div>
            <div className="page-title-header">
                <h1>Property Database</h1>
                <div className="db-header-actions">
                    <button className="btn btn-primary" onClick={() => setIsImportModalOpen(true)}>📥 Import from Property24</button>
                </div>
            </div>
            <p className="page-subtitle">
                Displaying {filteredProperties.length} of {properties.length} total properties. Manage your listings below.
            </p>
            <div className="db-filters">
                <input 
                    type="text" 
                    placeholder="Search by address or suburb..." 
                    className="filter-search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Pocket Listing</button>
            </div>
            {isLoading ? <p style={{padding: '20px'}}>Loading properties...</p> : (
                <div className="property-grid">
                    {filteredProperties.length > 0 ? (
                        filteredProperties.map(prop => (
                            <div key={prop.id} className="property-card">
                                <div className="property-image" style={{backgroundImage: `url(${prop.imageUrl || placeholderImage})`}}><div className={`property-status-tag status-${prop.status?.toLowerCase()}`}>{prop.status}</div></div>
                                <div className="property-content">
                                    <p className="property-price">R {prop.price ? prop.price.toLocaleString('en-ZA') : '0'}</p>
                                    <p className="property-address">{prop.address || prop.location}</p>
                                    <p className="property-specs">{getPropertySpecs(prop)}</p>
                                    <div className="property-footer"><span className="property-source">{prop.source}</span><label className="switch-label">Visible to AI</label><label className="switch"><input type="checkbox" defaultChecked={prop.isAiEnabled} /><span className="slider round"></span></label></div>
                                </div>
                            </div>
                        ))
                    ) : ( <div className="calendar-placeholder"><p>No properties found in your database or matching your search.</p></div> )}
                </div>
            )}
            {isImportModalOpen && ( <Modal onClose={() => setIsImportModalOpen(false)}> <h2>Import from Property24 CSV</h2> <a href="/agent-optimus-template.csv" download className="template-link">Download Template CSV</a> <input type="file" accept=".csv" onChange={handleFileSelect} className="csv-input" /> {csvFile && <p className="file-name-display">Selected file: {csvFile.name}</p>} <div className="modal-actions"> <button className="btn btn-outline" onClick={() => setIsImportModalOpen(false)}>Cancel</button> <button className="btn btn-primary" onClick={handleCsvImport} disabled={isUploading || !csvFile}>{isUploading ? 'Uploading & Processing...' : 'Upload & Process'}</button> </div> </Modal> )}
            {isAddModalOpen && ( <Modal onClose={() => setIsAddModalOpen(false)}> <h2>Add New "Pocket" Listing</h2> <div className="wizard-form-group"><label>Price (e.g., 1500000)</label><input name="price" value={newProperty.price} onChange={handleNewPropertyChange} /></div> <div className="wizard-form-group"><label>Address</label><input name="address" value={newProperty.address} onChange={handleNewPropertyChange} /></div> <div className="wizard-form-group"><label>Key Specs (e.g., 3 Bed | 2 Bath)</label><input name="specs" value={newProperty.specs} onChange={handleNewPropertyChange} /></div> <div className="wizard-form-group"><label>Image URL (Optional)</label><input name="imageUrl" value={newProperty.imageUrl} onChange={handleNewPropertyChange} /></div> <div className="modal-actions"> <button className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button> <button className="btn btn-primary" onClick={handleAddPocketListing} disabled={isUploading}>{isUploading ? 'Saving...' : 'Save Property'}</button> </div> </Modal> )}
        </div>
    );
}