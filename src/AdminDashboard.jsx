// src/AdminDashboard.jsx
import { useAuth } from './AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import logo from './assets/logo.png';
import { db, functions } from './firebaseClient';
import { httpsCallable } from 'firebase/functions';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useState } from 'react';

const tableStyle = { width: '100%', borderCollapse: 'collapse', marginTop: '24px' };
const thStyle = { borderBottom: '2px solid #e2e8f0', padding: '12px', textAlign: 'left', color: '#475569' };
const tdStyle = { borderBottom: '1px solid #e2e8f0', padding: '12px' };
const trStyle = { cursor: 'pointer' };
const statusStyle = (status) => ({ padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600', backgroundColor: status === 'ACTIVE_TRIAL' ? '#ecfdf5' : '#fffbeb', color: status === 'ACTIVE_TRIAL' ? '#065f46' : '#b45309'});
const waStatusStyle = (status) => ({
    padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
    backgroundColor: status === 'pending' ? '#fef08a' : '#f1f5f9',
    color: status === 'pending' ? '#713f12' : '#475569',
});

const ClickableTableRow = ({ agent, children }) => {
    const navigate = useNavigate();
    const handleNavigate = () => navigate(`/admin/users/${agent.id}`);
    return <tr style={trStyle} onClick={handleNavigate}>{children}</tr>;
};

export default function AdminDashboard() {
    const { user, signOut } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isActivating, setIsActivating] = useState(null);

    useEffect(() => {
        const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(usersQuery, 
            (snapshot) => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setAllUsers(usersData); setIsLoading(false);
            },
            (err) => { console.error("Firestore Error:", err); setError("Failed to fetch user data."); setIsLoading(false); }
        );
        return () => unsubscribe();
    }, []);

    const handleActivate = async (e, userId) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure?")) return;
        setIsActivating(userId);
        try {
            const activateUserTrial = httpsCallable(functions, 'activateUserTrial');
            await activateUserTrial({ userId: userId });
        } catch (error) { alert(`Failed to activate user: ${error.message}`);
        } finally { setIsActivating(null); }
    };

    return (
        <div className="wizard-container">
             <header className="wizard-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}><Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link><button onClick={signOut} className="btn btn-outline">Logout</button></header>
            <div className="wizard-content" style={{ maxWidth: '1000px' }}>
                <h1>Admin Dashboard</h1>
                <p>Welcome, Admin: <strong>{user?.email}</strong></p>
                <h3>All User Signups</h3>
                {!isLoading && !error && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={tableStyle}>
                            <thead><tr><th style={thStyle}>Email</th><th style={thStyle}>Company</th><th style={thStyle}>Status</th><th style={thStyle}>WhatsApp Status</th><th style={thStyle}>Signup Date</th><th style={thStyle}>Actions</th></tr></thead>
                            <tbody>
                                {allUsers.map(agent => (
                                    <ClickableTableRow key={agent.id} agent={agent}>
                                        <td style={tdStyle}>{agent.email}</td>
                                        <td style={tdStyle}>{agent.companyName || '--'}</td>
                                        <td style={tdStyle}><span style={statusStyle(agent.status)}>{agent.status}</span></td>
                                        <td style={tdStyle}>{agent.whatsappConnectionStatus && <span style={waStatusStyle(agent.whatsappConnectionStatus)}>{agent.whatsappConnectionStatus === 'pending' ? '🟡 Needs Connection' : agent.whatsappConnectionStatus}</span>}</td>
                                        <td style={tdStyle}>{agent.createdAt ? agent.createdAt.toDate().toLocaleDateString() : '--'}</td>
                                        <td style={tdStyle} onClick={(e) => e.stopPropagation()}>{agent.status === 'TRIAL_PENDING_ACTIVATION' && (<button className="btn btn-primary" onClick={(e) => handleActivate(e, agent.id)} disabled={isActivating === agent.id}>{isActivating === agent.id ? 'Activating...' : 'Activate'}</button>)}</td>
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