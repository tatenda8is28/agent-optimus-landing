// src/AccountPage.jsx
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { functions } from './firebaseClient';
import { httpsCallable } from 'firebase/functions';
import './AccountPage.css';

export default function AccountPage() {
    const { userProfile } = useAuth();
    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequestConnection = async () => {
        if (!window.confirm("This will notify the Agent Optimus team to schedule your connection call. Proceed?")) {
            return;
        }
        setIsRequesting(true);
        try {
            const requestConnectionFunc = httpsCallable(functions, 'requestWhatsAppConnection');
            await requestConnectionFunc();
            alert("Request sent! We will be in touch shortly.");
        } catch (error) {
            console.error("Error requesting connection:", error);
            alert(`Failed to send request: ${error.message}`);
        } finally {
            setIsRequesting(false);
        }
    };

    const renderConnectionStatus = () => {
        const status = userProfile?.whatsappConnectionStatus;

        if (status === 'pending') {
            return (
                <div className="connection-status-card pending">
                    <h3>✅ Request Sent!</h3>
                    <p>Our team has received your request and will be in touch within the next 24 hours to schedule your activation call.</p>
                </div>
            );
        }
        
        return (
            <div className="connection-status-card">
                <h3>Connect Your AI Agent to WhatsApp</h3>
                <p>This is the final step to bring your agent online. Click the button below to notify our team to schedule a brief call to securely scan your QR code and activate your bot.</p>
                <button 
                    className="btn btn-primary" 
                    onClick={handleRequestConnection}
                    disabled={isRequesting}
                >
                    {isRequesting ? 'Sending Request...' : '🙋‍♂️ Request Connection'}
                </button>
            </div>
        );
    };

    return (
        <div>
            <div className="page-title-header"><h1>Account Settings</h1></div>
            <div className="form-card">
                <h3>Subscription & Billing</h3>
                <p>Current Plan: <strong>Pro (Trial)</strong></p>
                <p>Your trial ends on October 27, 2025.</p>
                <button className="btn btn-primary">Manage Billing</button>
            </div>
            <div className="form-card">
                {renderConnectionStatus()}
            </div>
            <div className="form-card danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-zone-item">
                    <div><strong>Pause AI Agent</strong><p>Temporarily stop your agent from responding to messages.</p></div>
                    <button className="btn btn-outline">Pause Agent</button>
                </div>
                 <div className="danger-zone-item">
                    <div><strong>Delete Account</strong><p>Permanently delete your account and all associated data.</p></div>
                    <button className="btn btn-outline danger-btn">Delete Account</button>
                </div>
            </div>
        </div>
    );
}