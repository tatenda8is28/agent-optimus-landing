// src/AdminAgentDetailPage.jsx

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import './AdminAgentDetailPage.css'; // We will create this next

export default function AdminAgentDetailPage() {
    const { userId } = useParams(); // Gets the user ID from the URL
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
                // Fetch data from TWO collections
                const userDocRef = doc(db, 'users', userId);
                const playbookDocRef = doc(db, 'sales_playbooks', userId);

                const userDocSnap = await getDoc(userDocRef);
                const playbookDocSnap = await getDoc(playbookDocRef);

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
        <div>
            <div className="page-title-header">
                <Link to="/admin" className="back-link">← Back to All Users</Link>
            </div>

            <div className="agent-detail-grid">
                <div className="detail-card">
                    <h3>Agent Profile</h3>
                    <p><strong>Email:</strong> {agentProfile.email}</p>
                    <p><strong>Company:</strong> {agentProfile.companyName}</p>
                    <p><strong>Status:</strong> {agentProfile.status}</p>
                    <p><strong>Role:</strong> {agentProfile.role}</p>
                    <p><strong>Service Area:</strong> {agentProfile.serviceArea}</p>
                    <p><strong>WhatsApp #:</strong> {agentProfile.whatsappNumber}</p>
                </div>
                 <div className="detail-card">
                    <h3>Database Links</h3>
                    <p><strong>Link 1:</strong> {agentProfile.databaseLink1 || 'Not set'}</p>
                    <p><strong>Link 2:</strong> {agentProfile.databaseLink2 || 'Not set'}</p>
                    <p><strong>Link 3:</strong> {agentProfile.databaseLink3 || 'Not set'}</p>
                </div>
            </div>

            <div className="detail-card">
                <h3>Sales Playbook Configuration</h3>
                <pre className="code-block">
                    {salesPlaybook ? JSON.stringify(salesPlaybook, null, 2) : "No playbook configured."}
                </pre>
            </div>
             <div className="detail-card">
                <h3>Knowledge Base Document</h3>
                 <div className="knowledge-display" dangerouslySetInnerHTML={{ __html: agentProfile.knowledgeDocument || '<p>No knowledge base configured.</p>' }} />
            </div>
        </div>
    );
}