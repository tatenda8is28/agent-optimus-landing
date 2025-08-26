import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import logo from './assets/logo.png';
import { useScrollTracking } from './useScrollTracking.js';

const WhatsAppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M16.6 14.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.7.8-.8.9-.1.2-.2.2-.4.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.4.1-.1.2-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.7.7-.7 1.6s.7 1.9.8 2c.1.2 1.5 2.2 3.5 3.1.5.2.9.4 1.2.5.5.2 1 .1 1.3-.1.4-.2.7-.7.9-.9.2-.2.2-.4.1-.5l-.2-.1zM12 2a10 10 0 00-10 10c0 5.5 4.5 10 10 10 1.7 0 3.3-.4 4.8-1.2l3.4.9-1-3.3c.7-1.5 1.1-3.1 1.1-4.8A10 10 0 0012 2z" /></svg> );
const WhatsAppFAB = () => ( <a href="https://wa.me/27659030283?text=Hi!%20I'm%20interested%20in%20Agent%20Optimus." target="_blank" rel="noopener noreferrer" className="fab-whatsapp" aria-label="Chat on WhatsApp"><span className="fab-text">Talk to Us</span><WhatsAppIcon /></a> );

export default function Layout() {
    useScrollTracking();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    
    return (
        <div className="page">
            <header className="nav">
                <div className="container nav-row">
                    <Link to="/" className="brand"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
                    <nav className="nav-links">
                        <ul>
                            <li><a href="/#pricing">Pricing</a></li>
                            <li><Link to="/socialproof">Social Proof</Link></li>
                            <li><Link to="/howitworks">How It Works</Link></li>
                        </ul>
                        <Link className="btn btn-primary" to="/activate">Start Free Trial</Link>
                    </nav>
                    <button className={`menu-toggle ${isMenuOpen ? 'is-active' : ''}`} onClick={toggleMenu} aria-label="Toggle menu"><span className="hamburger"></span></button>
                </div>
                {isMenuOpen && (
                    <div className="mobile-nav">
                        <a href="/#pricing" onClick={toggleMenu}>Pricing</a>
                        <Link to="/socialproof" onClick={toggleMenu}>Social Proof</Link>
                        <Link to="/howitworks" onClick={toggleMenu}>How It Works</Link>
                        <Link className="btn btn-primary full-width" to="/activate" onClick={toggleMenu}>Start Free Trial</Link>
                    </div>
                )}
            </header>

            <Outlet />

            <footer className="footer">
                <div className="container"><p>© {new Date().getFullYear()} Agent Optimus. All Rights Reserved.</p></div>
            </footer>
            <WhatsAppFAB />
        </div>
    );
}