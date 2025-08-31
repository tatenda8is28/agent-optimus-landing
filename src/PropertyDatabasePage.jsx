// src/PropertyDatabasePage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import './PropertyDatabasePage.css';
import placeholderImage from './assets/hero-image.png';

const Modal = ({ children, onClose }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
            {children}
        </div>
    </div>
);

export default function PropertyDatabasePage() {
    const { user } = useAuth();
    const [properties, setProperties] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const [newProperty, setNewProperty] = useState({ price: '', address: '', specs: '', imageUrl: '' });
    const [csvFile, setCsvFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        const propertiesQuery = query(collection(db, 'properties'), where('agentId', '==', user.uid), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(propertiesQuery, (snapshot) => {
            const propsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProperties(propsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching properties:", error);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [user]);

    const handleNewPropertyChange = (e) => {
        const { name, value } = e.target;
        setNewProperty(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPocketListing = async () => {
        if (!user || !newProperty.price || !newProperty.address) {
            alert("Price and Address are required.");
            return;
        }
        setIsUploading(true);
        try {
            await addDoc(collection(db, 'properties'), {
                agentId: user.uid,
                price: parseInt(newProperty.price.replace(/[^0-9]/g, '')) || 0,
                address: newProperty.address,
                specs: newProperty.specs,
                imageUrl: newProperty.imageUrl,
                source: 'Manual Entry',
                status: 'Active',
                isAiEnabled: true,
                createdAt: serverTimestamp(),
                lastEditedBy: 'agent'
            });
            setNewProperty({ price: '', address: '', specs: '', imageUrl: '' });
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Error adding new property:", error);
            alert("Failed to add property.");
        }
        setIsUploading(false);
    };
    
    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type !== "text/csv") {
                alert("Please select a valid .csv file.");
                e.target.value = null;
                return;
            }
            setCsvFile(e.target.files[0]);
        }
    };

    const handleCsvImport = async () => {
        if (!user || !csvFile) {
            alert("Please select a CSV file to import.");
            return;
        }
        setIsUploading(true);
        try {
            const storage = getStorage();
            const filePath = `property-uploads/${user.uid}/${Date.now()}-${csvFile.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, csvFile);
            alert("File uploaded successfully! It will be processed in the background. Please check back in a few minutes for the properties to appear.");
            setCsvFile(null);
            setIsImportModalOpen(false);
        } catch(error) {
            console.error("Error uploading file:", error);
            alert("File upload failed.");
        }
        setIsUploading(false);
    };

    return (
        <div>
            <div className="page-title-header">
                <h1>Property Database</h1>
                <div className="db-header-actions">
                    <button className="btn btn-primary" onClick={() => setIsImportModalOpen(true)}>📥 Import from Property24</button>
                </div>
            </div>
            <p className="page-subtitle">Manage your listings via CSV or add individual properties manually.</p>
            
            <div className="db-filters">
                <input type="text" placeholder="Search by address or suburb..." className="filter-search-input" />
                <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Pocket Listing</button>
            </div>

            {isLoading ? <p style={{padding: '20px'}}>Loading properties...</p> : (
                <div className="property-grid">
                    {properties.length > 0 ? (
                        properties.map(prop => (
                            <div key={prop.id} className="property-card">
                                <div className="property-image" style={{backgroundImage: `url(${prop.imageUrl || placeholderImage})`}}>
                                    <div className={`property-status-tag status-${prop.status?.toLowerCase()}`}>{prop.status}</div>
                                </div>
                                <div className="property-content">
                                    <p className="property-price">R {prop.price.toLocaleString('en-ZA')}</p>
                                    <p className="property-address">{prop.address}</p>
                                    <p className="property-specs">{prop.specs}</p>
                                    <div className="property-footer">
                                        <span className="property-source">{prop.source}</span>
                                        <label className="switch-label">Visible to AI</label>
                                        <label className="switch">
                                            <input type="checkbox" defaultChecked={prop.isAiEnabled} />
                                            <span className="slider round"></span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="calendar-placeholder"><p>No properties found in your database. <br/>Use the buttons above to add your first listing.</p></div>
                    )}
                </div>
            )}

            {isImportModalOpen && (
                <Modal onClose={() => setIsImportModalOpen(false)}>
                    <h2>Import from Property24 CSV</h2>
                    <p>Upload a CSV file with your listings. The columns must match the provided template to ensure a successful import.</p>
                    <a href="/property24-template.csv" download className="template-link">Download Template CSV</a>
                    <input type="file" accept=".csv" onChange={handleFileSelect} className="csv-input" />
                    {csvFile && <p className="file-name-display">Selected file: {csvFile.name}</p>}
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleCsvImport} disabled={isUploading || !csvFile}>
                            {isUploading ? 'Uploading...' : 'Upload & Process'}
                        </button>
                    </div>
                </Modal>
            )}

            {isAddModalOpen && (
                <Modal onClose={() => setIsAddModalOpen(false)}>
                    <h2>Add New "Pocket" Listing</h2>
                    <div className="wizard-form-group"><label>Price (e.g., 1500000)</label><input name="price" value={newProperty.price} onChange={handleNewPropertyChange} /></div>
                    <div className="wizard-form-group"><label>Address</label><input name="address" value={newProperty.address} onChange={handleNewPropertyChange} /></div>
                    <div className="wizard-form-group"><label>Key Specs (e.g., 3 Bed | 2 Bath)</label><input name="specs" value={newProperty.specs} onChange={handleNewPropertyChange} /></div>
                    <div className="wizard-form-group"><label>Image URL (Optional)</label><input name="imageUrl" value={newProperty.imageUrl} onChange={handleNewPropertyChange} /></div>
                    <div className="modal-actions">
                        <button className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAddPocketListing} disabled={isUploading}>{isUploading ? 'Saving...' : 'Save Property'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}