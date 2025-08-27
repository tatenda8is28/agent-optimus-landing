// src/AdminDashboard.jsx

import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import logo from './assets/logo.png';

export default function AdminDashboard() {
    const { user, signOut } = useAuth();

    return (
        <div className="wizard-container">
             <header className="wizard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
                <button onClick={signOut} className="btn btn-outline">Logout</button>
            </header>
            <div className="wizard-content">
                <h1>Admin Dashboard</h1>
                <p>Welcome, Admin: <strong>{user?.email}</strong></p>
                <hr style={{margin: '24px 0'}}/>
                <p>This is the secure area for managing all users and signups. The 'Signups' table will be built here.</p>
            </div>
        </div>
    );
}