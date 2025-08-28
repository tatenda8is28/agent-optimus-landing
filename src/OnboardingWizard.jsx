// src/OnboardingWizard.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from './firebaseClient';
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import logo from './assets/logo.png';
import { useAuth } from "./AuthContext";

export default function OnboardingWizard() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({ fullName: '', companyName: '', serviceArea: '', whatsappNumber: '', databaseLink: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // NEW: If a non-logged-in user tries to access this page, send them to login.
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);


    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

    const handleFormSubmit = async () => {
        if (!user) {
            setError("Authentication error. Please sign in again.");
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const userProfile = {
                email: user.email,
                fullName: formData.fullName,
                companyName: formData.companyName,
                serviceArea: formData.serviceArea,
                whatsappNumber: formData.whatsappNumber,
                databaseLink: formData.databaseLink,
                status: 'TRIAL_PENDING_ACTIVATION',
                createdAt: serverTimestamp(),
                role: 'agent'
            };
            
            await setDoc(doc(db, "users", user.uid), userProfile);
            
            console.log("Successfully created user profile in Firestore.");

            // --- THE CRUCIAL FIX ---
            // After saving the profile, log the user out and send them to the login page.
            // This forces a full refresh of their session and profile, guaranteeing
            // they will be redirected to the correct dashboard on their next login.
            await auth.signOut();
            navigate('/login');

        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.message || 'An error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };
    
    // Show a loading screen while we wait for the user object to be confirmed
    if (!user) {
        return <div>Loading...</div>;
    }

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