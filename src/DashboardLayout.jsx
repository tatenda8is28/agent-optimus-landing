// src/DashboardLayout.jsx
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import logo from './assets/logo.png';
import './DashboardLayout.css';

const OverviewIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v11A1.5 1.5 0 002.5 17h15A1.5 1.5 0 0019 15.5v-11A1.5 1.5 0 0017.5 3h-15zM2 4.5a.5.5 0 01.5-.5h15a.5.5 0 01.5.5v2.5H2V4.5zM2 15.5V8h16v7.5a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5z" clipRule="evenodd" /></svg>);
const LeadsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" /><path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" /></svg>);
const DatabaseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M7 3.5A1.5 1.5 0 018.5 2h3A1.5 1.5 0 0113 3.5v1.252a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 017 4.752V3.5z" /><path fillRule="evenodd" d="M6.19 6.315a.75.75 0 01.44.668V7.25a.75.75 0 01-1.5 0v-.267a.75.75 0 01.44-.668l.22-.11a.75.75 0 000-1.33L5.13 4.76a.75.75 0 01-.44-.667V3.75a.75.75 0 011.5 0v.268a.75.75 0 01-.44.667l-.22.11a.75.75 0 000 1.33l.22.11zM14.81 6.315a.75.75 0 00-.44.668V7.25a.75.75 0 001.5 0v-.267a.75.75 0 00-.44-.668l-.22-.11a.75.75 0 010-1.33l.22-.11a.75.75 0 00.44-.667V3.75a.75.75 0 00-1.5 0v.268a.75.75 0 00.44.667l.22.11a.75.75 0 010 1.33l-.22.11z" clipRule="evenodd" /><path d="M10 8a1.5 1.5 0 011.5 1.5v1.252a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 017 10.752V9.5A1.5 1.5 0 018.5 8h3z" /><path d="M7 14.5a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5v1.252a1.5 1.5 0 01-1.5 1.5h-3a1.5 1.5 0 01-1.5-1.5V14.5z" /></svg>);
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M5.75 3a.75.75 0 01.75.75V4h7V3.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V3.75A.75.75 0 015.75 3zM4.5 8.25a.75.75 0 000 1.5h11a.75.75 0 000-1.5h-11z" clipRule="evenodd" /></svg>);
const BuildIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10.362 1.096a.75.75 0 00-.724 0L1.692 5.042a.75.75 0 00-.692.73V13.5a.75.75 0 00.308.612l8.5 5.25a.75.75 0 00.784 0l8.5-5.25a.75.75 0 00.308-.612V5.772a.75.75 0 00-.692-.73L10.362 1.096zM14 5.37l-3.25 2.006v4.94l3.25-2.005V5.37zm-4.5 6.946V7.376L6 5.37v4.94l3.5 2.156zM2.5 6.5l3-1.85V9.4l-3 1.85V6.5zm12 4.75l-3 1.85V9.4l3-1.85v4.75z" /></svg>);
const SettingsIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path fillRule="evenodd" d="M11.078 2.25c-.217 0-.424.04-.622.116A10.009 10.009 0 002.25 11.078c.076.198.116.405.116.622s-.04.424-.116.622a10.009 10.009 0 008.196 8.196c.198.076.405.116.622.116s.424-.04.622-.116a10.009 10.009 0 008.196-8.196c.076-.198.116-.405.116-.622s-.04-.424-.116-.622A10.009 10.009 0 0011.7 2.366c-.198-.076-.405-.116-.622-.116zM10 6a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" /></svg>);
const AccountIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.095a1.23 1.23 0 00.41-1.412A9.995 9.995 0 0010 12c-2.31 0-4.438.784-6.131 2.095z" /></svg>);
const HamburgerIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>);

export default function DashboardLayout() {
    const { user, signOut } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const onLogout = () => { if (window.confirm("Are you sure?")) { signOut(); } };
    const handleNavLinkClick = () => { setIsSidebarOpen(false); };

    return (
        <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-is-open' : ''}`}>
            {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
                <div className="sidebar-header">
                    <Link to="/dashboard" onClick={handleNavLinkClick}><img src={logo} alt="Agent Optimus" className="sidebar-logo" /></Link>
                </div>
                <nav className="sidebar-nav">
                    <div className="nav-group">
                        <h3 className="nav-group-title">MAIN WORKFLOW</h3>
                        <NavLink to="/dashboard" end onClick={handleNavLinkClick}><OverviewIcon /> Overview</NavLink>
                        <NavLink to="/leads" onClick={handleNavLinkClick}><LeadsIcon /> Leads</NavLink>
                    </div>
                    <div className="nav-group">
                        <h3 className="nav-group-title">MANAGEMENT</h3>
                        <NavLink to="/properties" onClick={handleNavLinkClick}><DatabaseIcon /> Properties</NavLink>
                        <NavLink to="/calendar" onClick={handleNavLinkClick}><CalendarIcon /> My Calendar</NavLink>
                    </div>
                    <div className="nav-group">
                        <h3 className="nav-group-title">CONFIGURATION</h3>
                        <NavLink to="/build" onClick={handleNavLinkClick}><BuildIcon /> Build My Agent</NavLink>
                        <NavLink to="/company-info" onClick={handleNavLinkClick}><SettingsIcon /> Company Info</NavLink>
                        <NavLink to="/account" onClick={handleNavLinkClick}><AccountIcon /> Account</NavLink>
                    </div>
                </nav>
                <div className="sidebar-footer">
                    <div className="user-profile"><span className="user-email" title={user?.email}>{user?.email}</span></div>
                    <button onClick={onLogout} className="logout-button">Logout</button>
                </div>
            </aside>
            <div className="main-content-wrapper">
                <header className="main-header">
                    <button className="mobile-menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}><HamburgerIcon /></button>
                </header>
                <main className="main-content"><Outlet /></main>
            </div>
        </div>
    );
}