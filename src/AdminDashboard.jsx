// src/AdminDashboard.jsx

import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import logo from './assets/logo.png';
import { db } from './firebaseClient';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';

// --- NEW STYLING FOR THE ADMIN TABLE ---
const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '24px' };
const thStyle = { borderBottom: '2px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#475569' };
const tdStyle = { borderBottom: '1px solid #e2e8f0', padding: '12px' };
const statusStyle = (status) => ({
    padding: '4px 10px',
    borderRadius: '99px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: status === 'ACTIVE_TRIAL' ? '#ecfdf5' : '#fffbeb',
    color: status === 'ACTIVE_TRIAL' ? '#065f46' : '#b45309',
});

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // This query fetches all documents from the 'users' collection,
        // ordered by when they were created.
        const usersQuery = query(
            collection(db, 'users'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(usersQuery, 
            (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllUsers(usersData);
                setIsLoading(false);
            },
            (err) => {
                console.error("Firestore Error:", err);
                setError("Failed to fetch user data. Ensure your security rules are correct for admins.");
                setIsLoading(false);
            }
        );

        // Cleanup the listener
        return () => unsubscribe();
    }, []);

    return (
        <div className="wizard-container">
             <header className="wizard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
                <button onClick={signOut} className="btn btn-outline">Logout</button>
            </header>
            <div className="wizard-content" style={{ maxWidth: '900px' }}>
                <h1>Admin Dashboard</h1>
                <p style={{ marginTop: '-20px', marginBottom: '32px' }}>Welcome, Admin: <strong>{user?.email}</strong></p>
                
                <h3>All User Signups</h3>
                
                {isLoading && <p>Loading users...</p>}
                {error && <p style={{color: 'red'}}>{error}</p>}
                
                {!isLoading && !error && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Email</th>
                                    <th style={thStyle}>Company</th>
                                    <th style={thStyle}>Status</th>
                                    <th style={thStyle}>Signup Date</th>
                                    <th style={thStyle}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allUsers.map(agent => (
                                    <tr key={agent.id}>
                                        <td style={tdStyle}>{agent.email}</td>
                                        <td style={tdStyle}>{agent.companyName || '--'}</td>
                                        <td style={tdStyle}><span style={statusStyle(agent.status)}>{agent.status}</span></td>
                                        <td style={tdStyle}>{agent.createdAt ? agent.createdAt.toDate().toLocaleDateString() : '--'}</td>
                                        <td style={tdStyle}>
                                            {agent.status === 'TRIAL_PENDING_ACTIVATION' && (
                                                <button className="btn btn-primary">Activate</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}