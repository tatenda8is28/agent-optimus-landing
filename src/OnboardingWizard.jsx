import { useState } from "react";
import { Link } from "react-router-dom";
import { createClient } from '@supabase/supabase-js';
import logo from './assets/logo.png';

const supabaseUrl = 'https://hgzzelsxzuuyxnyaoyzi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenplbHN4enV1eXhueWFveXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5OTM1ODIsImV4cCI6MjA2NzU2OTU4Mn0.lk4pudx3KIgsQ9dAW4FGS-IQzpq-oPfq8WbW8dMIAjs';
const supabase = createClient(supabaseUrl, supabaseKey);

const VideoModal = ({ videoId, closeModal }) => {
  if (!videoId) return null;
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>&times;</button>
        <div className="video-iframe-container">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default function OnboardingWizard() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ email: '', fullName: '', companyName: '', serviceArea: '', whatsappNumber: '', databaseLink: '' });
    const [modalVideoId, setModalVideoId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const openModal = (id) => setModalVideoId(id);
    const closeModal = () => setModalVideoId(null);
    const handleInputChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleFormSubmit = async () => {
        setIsSubmitting(true);
        const submissionData = { full_name: formData.fullName, email: formData.email, company_name: formData.companyName, service_area: formData.serviceArea, whatsapp_number: formData.whatsappNumber, database_link: formData.databaseLink };
        const { data, error } = await supabase.from('signups').insert([submissionData]);
        if (error) { console.error('Error submitting form:', error); alert('There was an error submitting your information. Please try again.'); setIsSubmitting(false);
        } else { console.log('Successfully submitted:', data); setIsSubmitting(false); nextStep(); }
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
                    <div className="wizard-step"><button className="btn-back" onClick={prevStep}>← Back</button><h1>Link Your Property Database</h1><p>Paste the link to your properties below. You can also skip this and add them later from your dashboard.</p><div className="wizard-helper-box"><p>This can be a link to your listings on:</p><ul><li>Your personal website</li><li>Private Property or Property24</li></ul></div><div className="wizard-form-group"><label htmlFor="databaseLink">Property Database Link (Optional)</label><input type="url" id="databaseLink" name="databaseLink" value={formData.databaseLink} onChange={handleInputChange} placeholder="https://www.yourwebsite.com/listings" /></div><button className="btn btn-primary full-width" onClick={handleFormSubmit} disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Activation Request →'}</button><button className="btn-skip" onClick={handleFormSubmit} disabled={isSubmitting}>Skip and Submit</button></div>
                )}
                {step === 4 && (
                    <div className="wizard-step text-center"><h1>Activation Submitted. We're On It.</h1><p>Thank you! We have everything we need. Your AI agent is now being built and submitted for official WhatsApp review.</p><div className="wizard-timeline"><div className="timeline-item"><strong>Our Review (1-2 Hours)</strong><p>We are personally verifying your setup to ensure it's perfect.</p></div><div className="timeline-item"><strong>WhatsApp Review (24-48 Hours)</strong><p>WhatsApp has a mandatory review process. We'll email you the moment you are approved.</p></div><div className="timeline-item"><strong>Go Live!</strong><p>Once approved, you'll get a final "Welcome" email with instructions to launch.</p></div></div><h3>While you wait, prepare for success:</h3><div className="wizard-next-steps"><button className="btn btn-outline" onClick={() => openModal('wCiD3h8BtZc')}>Watch Quickstart Guide</button><a href="https://calendly.com/your-link" target="_blank" rel="noopener noreferrer" className="btn btn-outline">Book Your Free Onboarding Call</a></div></div>
                )}
            </div>
            <VideoModal videoId={modalVideoId} closeModal={closeModal} />
        </div>
    );
}