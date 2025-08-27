// src/OnboardingWizard.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from './firebaseClient'; // <-- Import Firebase services
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import logo from './assets/logo.png';

// Note: The VideoModal component can be removed if you are not using it right now.
const VideoModal = ({ videoId, closeModal }) => {
  // ... (same as before)
};


export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '', companyName: '', serviceArea: '', whatsappNumber: '', databaseLink: '' });
    const [modalVideoId, setModalVideoId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const openModal = (id) => setModalVideoId(id);
    const closeModal = () => setModalVideoId(null);
    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    // --- NEW FIREBASE FORM SUBMISSION LOGIC ---
    const handleFormSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        // We need a temporary password. Magic Link will be for login.
        // Let's create a secure, random password for the initial user creation.
        const tempPassword = Math.random().toString(36).slice(-8);

        try {
            // Step 1: Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, tempPassword);
            const user = userCredential.user;

            console.log("Successfully created auth user:", user.uid);

            // Step 2: Create the user profile document in Firestore
            const userProfile = {
                email: formData.email,
                fullName: formData.fullName,
                companyName: formData.companyName,
                serviceArea: formData.serviceArea,
                whatsappNumber: formData.whatsappNumber,
                databaseLink: formData.databaseLink,
                status: 'TRIAL_PENDING_ACTIVATION', // <-- The crucial status for the dashboard
                createdAt: serverTimestamp()
            };

            await setDoc(doc(db, "users", user.uid), userProfile);
            
            console.log("Successfully created user profile in Firestore.");

            setIsSubmitting(false);
            nextStep(); // Move to the "Success" screen

        } catch (error) {
            console.error('Error submitting form:', error);
            setError(error.message || 'An error occurred. Please try again.');
            setIsSubmitting(false);
        }
    };
    
    const progress = (step / 4) * 100;

    return (
        <div className="wizard-container">
            <header className="wizard-header"><Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link></header>
            <div className="wizard-progress-bar"><div className="wizard-progress" style={{ width: `${progress}%` }}></div></div>
            <div className="wizard-content">
                {step === 1 && (
                    <div className="wizard-step"><h1>Let's Create Your AI Co-Pilot</h1><p>This is the primary account for managing your agent. It takes 60 seconds.</p><div className="wizard-form-group"><label htmlFor="fullName">Full Name</label><input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="e.g. Jane Doe" /></div><div className="wizard-form-group"><label htmlFor="email">Work Email</label><input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="e.g. jane@realestate.com" /></div><button className="btn btn-primary full-width" onClick={nextStep}>Continue →</button></div>
                )}
                {step === 2 && (
                    <div className="wizard-step"><button className="btn-back" onClick={prevStep}>← Back</button><h1>Tell Your Agent About Your Business</h1><p>This information allows your AI to introduce itself correctly and search in the right areas.</p><div className="wizard-form-group"><label htmlFor="companyName">Company Name</label><input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} placeholder="e.g. Prestige Properties" /></div><div className="wizard-form-group"><label htmlFor="serviceArea">Primary Service Area</label><input type="text" id="serviceArea" name="serviceArea" value={formData.serviceArea} onChange={handleInputChange} placeholder="e.g. Stilfontein, South Africa" /></div><div className="wizard-form-group"><label htmlFor="whatsappNumber">Your WhatsApp Business Number</label><input type="tel" id="whatsappNumber" name="whatsappNumber" value={formData.whatsappNumber} onChange={handleInputChange} placeholder="e.g. +27 12 345 6789" /></div><button className="btn btn-primary full-width" onClick={nextStep}>Save & Continue →</button></div>
                )}
                {step === 3 && (
                    <div className="wizard-step"><button className="btn-back" onClick={prevStep}>← Back</button><h1>Link Your Property Database</h1><p>Paste the link to your properties below. You can also skip this and add them later from your dashboard.</p><div className="wizard-helper-box"><p>This can be a link to your listings on:</p><ul><li>Your personal website</li><li>Private Property or Property24</li></ul></div><div className="wizard-form-group"><label htmlFor="databaseLink">Property Database Link (Optional)</label><input type="url" id="databaseLink" name="databaseLink" value={formData.databaseLink} onChange={handleInputChange} placeholder="https://www.yourwebsite.com/listings" /></div>{error && <p style={{color: 'red'}}>{error}</p>}<button className="btn btn-primary full-width" onClick={handleFormSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Activation Request →'}</button><button className="btn-skip" onClick={handleFormSubmit} disabled={isSubmitting}>Skip and Submit</button></div>
                )}
                {/* --- THIS IS THE NEW SUCCESS SCREEN --- */}
                {step === 4 && (
                     <div className="wizard-step text-center"><h1>Activation Submitted. We're On It.</h1><p>Thank you! Your account has been created. We are now building your AI agent. Please check your email for a login link to view your onboarding status.</p><p><strong>You can now close this window.</strong></p><button onClick={() => navigate('/login')} className="btn btn-primary">Go to Login</button></div>
                )}
            </div>
            {/* The VideoModal can be kept or removed as needed */}
        </div>
    );
}