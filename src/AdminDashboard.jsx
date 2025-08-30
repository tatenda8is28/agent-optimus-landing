// src/AdminDashboard.jsx

import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom'; // <-- Add useNavigate
import logo from './assets/logo.png';
import { db, functions } from './firebaseClient';
import { httpsCallable } from 'firebase/functions';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// ... (Styling objects remain the same)
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '24px' };
const thStyle = { borderBottom: '2px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#475569' };
const tdStyle = { borderBottom: '1px solid #e2e8f0', padding: '12px' };
const trStyle = { cursor: 'pointer' }; // <-- Add cursor pointer for rows
const statusStyle = (status) => ({ /* ... */ });

// A new component to make rows clickable
const ClickableTableRow = ({ agent, children }) => {
    const navigate = useNavigate();
    const handleNavigate = () => {
        navigate(`/admin/users/${agent.id}`);
    };
    return <tr style={trStyle} onClick={handleNavigate}>{children}</tr>;
};

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isActivating, setIsActivating] = useState(null);

    useEffect(() => { /* ... (Data fetching logic is unchanged) */ }, []);

    const handleActivate = async (e, userId) => {
        e.stopPropagation(); // <-- Prevent row click from firing
        if (!window.confirm("Are you sure?")) return;
        setIsActivating(userId);
        try {
            const activateUserTrial = httpsCallable(functions, 'activateUserTrial');
            await activateUserTrial({ userId: userId });
        } catch (error) {
            alert(`Failed to activate user: ${error.message}`);
        } finally {
            setIsActivating(null);
        }
    };

    return (
        <div className="wizard-container">
             <header className="wizard-header"> {/* ... Header ... */} </header>
            <div className="wizard-content" style={{ maxWidth: '900px' }}>
                <h1>Admin Dashboard</h1>
                <p>Welcome, Admin: <strong>{user?.email}</strong></p>
                <h3>All User Signups</h3>
                
                {!isLoading && !error && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead><tr>{/* ... Table headers ... */}</tr></thead>
                            <tbody>
                                {allUsers.map(agent => (
                                    <ClickableTableRow key={agent.id} agent={agent}>
                                        <td style={tdStyle}>{agent.email}</td>
                                        <td style={tdStyle}>{agent.companyName || '--'}</td>
                                        <td style={tdStyle}><span style={statusStyle(agent.status)}>{agent.status}</span></td>
                                        <td style={tdStyle}>{agent.createdAt ? agent.createdAt.toDate().toLocaleDateString() : '--'}</td>
                                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}> {/* Stop propagation on this cell */}
                                            {agent.status === 'TRIAL_PENDING_ACTIVATION' && (
                                                <button 
                                                    className="btn btn-primary" 
                                                    onClick={(e) => handleActivate(e, agent.id)}
                                                    disabled={isActivating === agent.id}
                                                >
                                                    {isActivating === agent.id ? 'Activating...' : 'Activate'}
                                                </button>
                                            )}
                                        </td>
                                    </ClickableTableRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}