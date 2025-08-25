import { useState } from "react";
import { Link } from "react-router-dom";
import heroImage from './assets/hero-image.png';

const CheckIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="icon-svg check-feature"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg> );
const CrossIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="icon-svg cross"><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" /></svg> );
const ArrowLeftIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" /></svg> );
const ArrowRightIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" /></svg> );
const UserIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="flow-icon"><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" /></svg> );
const BotIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="flow-icon"><path d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM9 12.75a.75.75 0 000 1.5h6a.75.75 0 000-1.5H9z" /><path fillRule="evenodd" d="M12 3.75a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V4.5a.75.75 0 01.75-.75zM15 6.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V6.75zM8.25 6a.75.75 0 00-.75.75v.008a.75.75 0 00.75.75h.008a.75.75 0 00.75-.75V6.75a.75.75 0 00-.75-.75H8.25z" clipRule="evenodd" /></svg> );
const HouseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="flow-icon"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.026.026.05.054.07.084v6.101A2.25 2.25 0 0117.75 22.5h-3.5a.75.75 0 01-.75-.75V18a.75.75 0 00-.75-.75h-2.5a.75.75 0 00-.75.75v3.75a.75.75 0 01-.75.75h-3.5A2.25 2.25 0 013.75 19.75v-6.101c.02-.03.044-.058.07-.084L12 5.432z" /></svg> );
const CalendarIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="flow-icon"><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 2.25h.75a2.25 2.25 0 012.25 2.25v13.5a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V4.5A2.25 2.25 0 013.75 3H4.5a.75.75 0 01.75-.75h1.5zM8.25 10.5a.75.75 0 000 1.5h7.5a.75.75 0 000-1.5H8.25z" clipRule="evenodd" /></svg> );

const HomeHowItWorks = () => {
    const videoData = [
        { id: 'wCiD3h8BtZc', title: 'The "First Handshake," Perfected.', description: 'Guarantees every client gets an instant, professional response.' },
        { id: 'wCiD3h8BtZc', title: 'The "Always-On" Calendar.', description: 'Turns qualified leads into booked appointments in your calendar.' },
        { id: 'wCiD3h8BtZc', title: 'Your "Instant Expert."', description: 'Provides detailed property info and answers complex questions instantly.' },
    ];
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextVideo = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % videoData.length);
    };

    const prevVideo = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + videoData.length) % videoData.length);
    };
    
    const currentVideo = videoData[currentIndex];

    return (
        <section className="section video-slider-section">
            <div className="container">
                <div className="section-header">
                    <h2>How The Optimus Method Works</h2>
                </div>
                <div className="video-slider">
                    <div className="video-player">
                        <iframe
                            key={currentVideo.id}
                            src={`https://www.youtube.com/embed/${currentVideo.id}?rel=0&autoplay=0`}
                            title={currentVideo.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                    <div className="video-info">
                        <h3>{currentVideo.title}</h3>
                        <p>{currentVideo.description}</p>
                        <div className="video-controls">
                            <button onClick={prevVideo} className="btn-arrow"><ArrowLeftIcon /></button>
                            <span>{currentIndex + 1} / {videoData.length}</span>
                            <button onClick={nextVideo} className="btn-arrow"><ArrowRightIcon /></button>
                        </div>
                    </div>
                </div>
                <div className="text-center video-cta">
                    <Link to="/howitworks" className="btn btn-primary btn-large">See How It Works</Link>
                </div>
            </div>
        </section>
    );
};


export default function HomePage() {
  return (
    <main>
      <section className="hero"><div className="container hero-grid"><div className="hero-copy"><h1 className="hero-title">Close Deals While You Sleep.</h1><p className="hero-sub">Real Estate Agents, Optimus is your lead partner on WhatsApp. It qualifies every lead, answers property questions, and books viewings so you wake up to a calendar full of appointments.</p><div className="hero-ctas"><Link className="btn btn-primary btn-large" to="/activate">Start Your Free 60-Day Trial</Link></div></div><div className="hero-graphic"><img src={heroImage} alt="Agent Optimus in action" className="hero-img" /></div></div></section>
      
      <HomeHowItWorks />

      <section id="how" className="section section-muted"><div className="container"><div className="section-header"><h2>Get Started in 5 Minutes</h2></div><div className="how-it-works-flow"><div className="flow-step"><UserIcon /><span>User Inquires</span></div><div className="flow-arrow">→</div><div className="flow-step"><BotIcon /><span>Optimus Qualifies Lead</span></div><div className="flow-arrow">→</div><div className="flow-step"><HouseIcon /><span>Searches Listings</span></div><div className="flow-arrow">→</div><div className="flow-step"><CalendarIcon /><span>Schedules Viewing</span></div></div></div></section>

      <section id="features" className="section"><div className="container"><div className="section-header"><h2>Your Unfair Advantage</h2></div><div className="grid two-col"><div className="feature-card"><CheckIcon /><div className="feature-text-content"><p className="feature-title">Your All-Knowing Property Expert</p><p className="feature-text">The AI becomes an expert on your listings, ready to answer any buyer question, day or night.</p></div></div><div className="feature-card"><CheckIcon /><div className="feature-text-content"><p className="feature-title">Automatic & Organized Records</p><p className="feature-text">Every conversation and lead detail is automatically logged to your Google Sheet or CRM.</p></div></div><div className="feature-card"><CheckIcon /><div className="feature-text-content"><p className="feature-title">Perfect Lead Qualification</p><p className="feature-text">Separate tire-kickers from serious buyers by automatically uncovering their budget and needs.</p></div></div><div className="feature-card"><CheckIcon /><div className="feature-text-content"><p className="feature-title">Seamless Calendar Integration</p><p className="feature-text">Agent Optimus checks your real-time availability and books viewings without you lifting a finger.</p></div></div></div></div></section>
      <section id="pricing" className="section section-muted"><div className="container"><div className="section-header"><h2>Simple, Transparent Pricing</h2></div><div className="grid three-col"><div className="plan"><div className="plan-name">Starter</div><div className="plan-price">R1,990/mo</div><ul className="plan-points"><li>1 WhatsApp number</li><li>Basic lead funnel</li><li>Email notifications</li></ul><a className="btn btn-outline full-width" href="#">Choose Plan</a></div><div className="plan highlight"><div className="plan-name">Pro</div><div className="plan-price">R3,990/mo</div><ul className="plan-points"><li>Up to 3 WhatsApp numbers</li><li><strong>Intelligent Property Search</strong></li><li><strong>Google Calendar Booking</strong></li><li>Sheets/CRM Logging</li></ul><Link className="btn btn-primary full-width" to="/activate">Start Free 60-Day Trial</Link></div><div className="plan"><div className="plan-name">Enterprise</div><div className="plan-price">Contact Us</div><ul className="plan-points"><li>Unlimited Agents</li><li>Custom Integrations</li><li>Dedicated Support</li></ul><a className="btn btn-outline full-width" href="#">Book a Consultation</a></div></div></div></section>
      <section id="demo" className="section cta-section"><div className="container text-center"><h2>Ready to Transform Your Business?</h2><p className="cta-sub">Activate your 24/7 AI agent in minutes. Stop missing leads and start closing more deals.</p><Link className="btn btn-primary btn-large" to="/activate">Get Your Free 60-Day Trial</Link></div></section>
    </main>
  );
}