// src/DashboardPage.jsx

import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import logo from './assets/logo.png';

export default function DashboardPage() {
    const { user, signOut } = useAuth();

    return (
        <div className="wizard-container">
             <header className="wizard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
                <button onClick={signOut} className="btn btn-outline">Logout</button>
            </header>
            <div className="wizard-content">
                <h1>Welcome to Mission Control</h1>
                <p>You are logged in as: <strong>{user?.email}</strong></p>
                <hr style={{margin: '24px 0', border: 'none', borderBottom: '1px solid #e2e8f0'}}/>
                
                {/* This is the placeholder for the MLP Dashboard content */}
                <h3>Your AI Agent is: <span style={{color: '#059669'}}>🟢 Active</span></h3>
                <p>Key metrics and the recent activity feed will be built here.</p>
            </div>
        </div>
    );
}