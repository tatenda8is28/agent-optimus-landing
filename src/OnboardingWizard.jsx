// src/OnboardingWizard.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from './firebaseClient';
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import logo from './assets/logo.png';
import { useAuth } from "./AuthContext";

export default function OnboardingWizard() {
    const { user } = useAuth(); // Get the currently logged-in user
    const [formData, setFormData] = useState({ fullName: '', companyName: '', serviceArea: '', whatsappNumber: '', databaseLink: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async () => {
        if (!user) {
            setError("You must be signed in to complete this step.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // We are UPDATING the user's document, not creating an auth user.
            const userProfile = {
                email: user.email,
                fullName: formData.fullName,
                companyName: formData.companyName,
                serviceArea: formData.serviceArea,
                whatsappNumber: formData.whatsappNumber,
                databaseLink: formData.databaseLink,
                status: 'TRIAL_PENDING_ACTIVATION',
                createdAt: serverTimestamp(),
                role: 'agent' // Set default role
            };
            
            // Use setDoc to create/overwrite the document with the user's UID
            await setDoc(doc(db, "users", user.uid), userProfile);
            
            console.log("Successfully created/updated user profile in Firestore.");
            
            // Manually redirect to dashboard. The AuthContext will then see the new profile.
            navigate('/dashboard');

        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.message || 'An error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };
    
    // Simplified to a single step for profile completion
    return (
        <div className="wizard-container">
            <header className="wizard-header"><Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link></header>
            <div className="wizard-content">
                <div className="wizard-step">
                    <h1>Almost there! Complete Your Profile.</h1>
                    <p>We need a few more details to set up your AI co-pilot.</p>
                    <div className="wizard-form-group"><label>Full Name</label><input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} /></div>
                    <div className="wizard-form-group"><label>Company Name</label><input type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} /></div>
                    <div className="wizard-form-group"><label>Primary Service Area</label><input type="text" name="serviceArea" value={formData.serviceArea} onChange={handleInputChange} /></div>
                    <div className="wizard-form-group"><label>WhatsApp Business Number</label><input type="tel" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} /></div>
                    <div className="wizard-form-group"><label>Property Database Link (Optional)</label><input type="url" name="databaseLink" value={formData.databaseLink} onChange={handleInputChange} /></div>
                    {error && <p style={{color: 'red'}}>{error}</p>}
                    <button className="btn btn-primary full-width" onClick={handleFormSubmit} disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Complete Activation'}</button>
                </div>
            </div>
        </div>
    );
}