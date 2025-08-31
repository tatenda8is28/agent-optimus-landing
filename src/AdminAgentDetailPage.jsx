// src/AdminAgentDetailPage.jsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import './AdminAgentDetailPage.css';

export default function AdminAgentDetailPage() {
    const { userId } = useParams();
    const [agentProfile, setAgentProfile] = useState(null);
    const [salesPlaybook, setSalesPlaybook] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setError('');
            try {
                // Fetch data from BOTH collections concurrently
                const userDocRef = doc(db, 'users', userId);
                const playbookDocRef = doc(db, 'sales_playbooks', userId);

                const [userDocSnap, playbookDocSnap] = await Promise.all([
                    getDoc(userDocRef),
                    getDoc(playbookDocRef)
                ]);

                if (userDocSnap.exists()) {
                    setAgentProfile(userDocSnap.data());
                } else {
                    throw new Error("User profile not found.");
                }

                if (playbookDocSnap.exists()) {
                    setSalesPlaybook(playbookDocSnap.data());
                }
                
            } catch (err) {
                console.error("Error fetching agent details:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (isLoading) {
        return <div style={{ padding: '40px' }}>Loading Agent Details...</div>;
    }

    if (error) {
        return <div style={{ padding: '40px', color: 'red' }}>Error: {error}</div>;
    }

    return (
        <div className="admin-detail-page">
            <div className="page-title-header">
                <Link to="/admin" className="back-link">← Back to All Users</Link>
            </div>
            
            <h2>Viewing Configuration for: {agentProfile.email}</h2>

            <div className="agent-detail-grid">
                <div className="detail-card">
                    <h3>Company Info</h3>
                    <p><strong>Company Name:</strong> {agentProfile.companyName || 'N/A'}</p>
                    <p><strong>Service Area:</strong> {agentProfile.serviceArea || 'N/A'}</p>
                    <p><strong>WhatsApp #:</strong> {agentProfile.whatsappNumber || 'N/A'}</p>
                    <hr/>
                    <p><strong>DB Link 1:</strong> {agentProfile.databaseLink1 || 'N/A'}</p>
                    <p><strong>DB Link 2:</strong> {agentProfile.databaseLink2 || 'N/A'}</p>
                    <p><strong>DB Link 3:</strong> {agentProfile.databaseLink3 || 'N/A'}</p>
                </div>
                 <div className="detail-card">
                    <h3>Account Status</h3>
                    <p><strong>Full Name:</strong> {agentProfile.fullName || 'N/A'}</p>
                    <p><strong>Status:</strong> <span className={`status-pill ${agentProfile.status}`}>{agentProfile.status}</span></p>
                    <p><strong>Role:</strong> {agentProfile.role}</p>
                    <p><strong>DNC List:</strong> {agentProfile.doNotContactList?.length || 0} numbers</p>
                    <p><strong>Personality:</strong> Prof: {agentProfile.personality?.professionalism}, Enth: {agentProfile.personality?.enthusiasm}</p>
                </div>
            </div>

            <div className="detail-card">
                <h3>Sales Playbook Configuration</h3>
                <pre className="code-block">
                    {salesPlaybook ? JSON.stringify(salesPlaybook, null, 2) : "No sales playbook has been configured yet."}
                </pre>
            </div>

             <div className="detail-card">
                <h3>Knowledge Base Document</h3>
                 <div className="knowledge-display">
                   <textarea readOnly value={agentProfile.knowledgeDocument?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "") || 'No knowledge base configured.'} rows="15" />
                 </div>
            </div>
        </div>
    );
}