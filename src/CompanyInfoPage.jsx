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
        databaseLink: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Pre-populate the form with existing user profile data when the component loads
    useEffect(() => {
        if (userProfile) {
            setFormData({
                companyName: userProfile.companyName || '',
                serviceArea: userProfile.serviceArea || '',
                databaseLink: userProfile.databaseLink || ''
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
            // Get a reference to the user's document in Firestore
            const userDocRef = doc(db, 'users', user.uid);
            
            // Update the document with the new form data
            await updateDoc(userDocRef, {
                companyName: formData.companyName,
                serviceArea: formData.serviceArea,
                databaseLink: formData.databaseLink
            });

            setSaveMessage('Changes saved successfully!');
        } catch (error) {
            console.error("Error updating document:", error);
            setSaveMessage('Error: Could not save changes.');
        } finally {
            setIsSaving(false);
            // Hide the success message after a few seconds
            setTimeout(() => setSaveMessage(''), 3000);
        }
    };
    
    // Show a loading state while we wait for the initial user data
    if (isLoading) {
        return <div>Loading company info...</div>;
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
            <p className="page-subtitle">Manage your core business details and connect your property data.</p>
            
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
            </div>
            <div className="form-card">
                <h3>Property Database Connection</h3>
                <div className="wizard-form-group">
                    <label htmlFor="databaseLink">Live Sync URL (Property24, etc.)</label>
                    <input type="url" id="databaseLink" name="databaseLink" value={formData.databaseLink} onChange={handleInputChange} />
                </div>
                <p style={{textAlign: 'center', margin: '16px 0', color: 'var(--ink-light)'}}>OR</p>
                <div className="wizard-form-group">
                    <label>Manual Upload (CSV or Excel) - (Coming Soon)</label>
                    <div className="file-drop-zone">Upload Property File</div>
                </div>
            </div>
        </div>
    );
}