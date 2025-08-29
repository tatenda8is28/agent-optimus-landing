// src/CompanyInfoPage.jsx

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from './firebaseClient';
import { doc, updateDoc } from 'firebase/firestore';

export default function CompanyInfoPage() {
    const { user, userProfile } = useAuth();
    const [formData, setFormData] = useState({
        companyName: '',
        serviceArea: '',
        whatsappNumber: '', // <-- NEW
        databaseLink1: '',  // <-- NEW
        databaseLink2: '',  // <-- NEW
        databaseLink3: ''   // <-- NEW
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        if (userProfile) {
            setFormData({
                companyName: userProfile.companyName || '',
                serviceArea: userProfile.serviceArea || '',
                whatsappNumber: userProfile.whatsappNumber || '', // <-- NEW
                databaseLink1: userProfile.databaseLink1 || '', // <-- NEW
                databaseLink2: userProfile.databaseLink2 || '', // <-- NEW
                databaseLink3: userProfile.databaseLink3 || ''  // <-- NEW
            });
            setIsLoading(false);
        }
    }, [userProfile]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async () => {
        if (!user) {
            alert("Error: You must be logged in to save changes.");
            return;
        }

        setIsSaving(true);
        setSaveMessage('');

        try {
            const userDocRef = doc(db, 'users', user.uid);
            
            // Update the document with all the new form data
            await updateDoc(userDocRef, {
                companyName: formData.companyName,
                serviceArea: formData.serviceArea,
                whatsappNumber: formData.whatsappNumber, // <-- NEW
                databaseLink1: formData.databaseLink1, // <-- NEW
                databaseLink2: formData.databaseLink2, // <-- NEW
                databaseLink3: formData.databaseLink3  // <-- NEW
            });

            setSaveMessage('Changes saved successfully!');
        } catch (error) {
            console.error("Error updating document:", error);
            setSaveMessage('Error: Could not save changes.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };
    
    if (isLoading) {
        return <div style={{padding: '40px'}}>Loading company info...</div>;
    }

    return (
        <div>
            <div className="page-title-header">
                <h1>Company Info</h1>
                <button 
                    className="btn btn-primary"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
            <p className="page-subtitle">Manage your core business details and connect your property data sources.</p>
            
            {saveMessage && (
                <div 
                    style={{
                        padding: '12px 16px', 
                        borderRadius: '8px', 
                        marginBottom: '24px', 
                        backgroundColor: saveMessage.includes('Error') ? 'var(--red)' : 'var(--green-light)',
                        color: saveMessage.includes('Error') ? 'var(--red-dark)' : 'var(--green-dark)',
                        fontWeight: 500
                    }}
                >
                    {saveMessage}
                </div>
            )}

            <div className="form-card">
                <h3>Business Details</h3>
                <div className="wizard-form-group">
                    <label htmlFor="companyName">Company Name</label>
                    <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} />
                </div>
                <div className="wizard-form-group">
                    <label htmlFor="serviceArea">Primary Service Area(s)</label>
                    <input type="text" id="serviceArea" name="serviceArea" value={formData.serviceArea} onChange={handleInputChange} placeholder="e.g. Klerksdorp, Flamwood" />
                </div>
                {/* --- NEW WHATSAPP NUMBER FIELD --- */}
                <div className="wizard-form-group">
                    <label htmlFor="whatsappNumber">WhatsApp Business Number</label>
                    <input type="tel" id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="e.g. +27821234567" />
                </div>
            </div>

            {/* --- REVISED DATABASE SECTION --- */}
            <div className="form-card">
                <h3>Property Database Links</h3>
                <p style={{color: 'var(--ink-light)', fontSize: '14px', marginTop: '-8px', marginBottom: '16px'}}>
                    Provide links to your listings on property portals. Your AI will use these as its source of knowledge.
                </p>
                <div className="wizard-form-group">
                    <label htmlFor="databaseLink1">Property Portal Link 1 (e.g., Property24)</label>
                    <input type="url" id="databaseLink1" name="databaseLink1" value={formData.databaseLink1} onChange={handleInputChange} placeholder="https://www.property24.co.za/..." />
                </div>
                 <div className="wizard-form-group">
                    <label htmlFor="databaseLink2">Property Portal Link 2 (e.g., Private Property)</label>
                    <input type="url" id="databaseLink2" name="databaseLink2" value={formData.databaseLink2} onChange={handleInputChange} placeholder="https://www.privateproperty.co.za/..." />
                </div>
                 <div className="wizard-form-group">
                    <label htmlFor="databaseLink3">Company Website Listings Link</label>
                    <input type="url" id="databaseLink3" name="databaseLink3" value={formData.databaseLink3} onChange={handleInputChange} placeholder="https://www.your-agency.co.za/listings" />
                </div>
            </div>
        </div>
    );
}