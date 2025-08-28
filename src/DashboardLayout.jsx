// src/DashboardLayout.jsx

import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import logo from './assets/logo.png';
import './DashboardLayout.css'; // We will create this next

const UserIcon = () => ( /* Placeholder Icon */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" clipRule="evenodd" /></svg>);
const LeadsIcon = () => ( /* Placeholder Icon */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>);
const BuildIcon = () => ( /* Placeholder Icon */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10.362 1.096a.75.75 0 00-.724 0L1.692 5.042a.75.75 0 00-.692.73V13.5a.75.75 0 00.308.612l8.5 5.25a.75.75 0 00.784 0l8.5-5.25a.75.75 0 00.308-.612V5.772a.75.75 0 00-.692-.73L10.362 1.096zM14 5.37l-3.25 2.006v4.94l3.25-2.005V5.37zm-4.5 6.946V7.376L6 5.37v4.94l3.5 2.156zM2.5 6.5l3-1.85V9.4l-3 1.85V6.5zm12 4.75l-3 1.85V9.4l3-1.85v4.75z" /></svg>);
const SettingsIcon = () => ( /* Placeholder Icon */ <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M11.078 2.25c-.217 0-.424.04-.622.116A10.009 10.009 0 002.25 11.078c.076.198.116.405.116.622s-.04.424-.116.622a10.009 10.009 0 008.196 8.196c.198.076.405.116.622.116s.424-.04.622-.116a10.009 10.009 0 008.196-8.196c.076-.198.116-.405.116-.622s-.04-.424-.116-.622A10.009 10.009 0 0011.7 2.366c-.198-.076-.405-.116-.622-.116zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>);

export default function DashboardLayout() {
    const { user, signOut } = useAuth();
    // In a real app, you might have a dropdown for the user profile
    const onLogout = () => {
        if (window.confirm("Are you sure you want to log out?")) {
            signOut();
        }
    };

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <Link to="/dashboard"><img src={logo} alt="Agent Optimus" className="sidebar-logo" /></Link>
                </div>
                <nav className="sidebar-nav">
                    <NavLink to="/dashboard" end><LeadsIcon /> Leads</NavLink>
                    <NavLink to="/build"><BuildIcon /> Build My Agent</NavLink>
                    <NavLink to="/company-info"><SettingsIcon /> Company Info</NavLink>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile">
                        <UserIcon />
                        <span className="user-email" title={user?.email}>{user?.email}</span>
                    </div>
                    <button onClick={onLogout} className="logout-button">Logout</button>
                </div>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}