// src/AccountPage.jsx
import './AccountPage.css'; // We will create this

export default function AccountPage() {
    return (
        <div>
            <div className="page-title-header"><h1>Account Settings</h1></div>
            <div className="form-card">
                <h3>Subscription & Billing</h3>
                <p>Current Plan: <strong>Pro (Trial)</strong></p>
                <p>Your trial ends on October 27, 2025.</p>
                <button className="btn btn-primary">Manage Billing</button>
            </div>
            <div className="form-card danger-zone">
                <h3>Danger Zone</h3>
                <div className="danger-zone-item">
                    <div>
                        <strong>Pause AI Agent</strong>
                        <p>Temporarily stop your agent from responding to messages.</p>
                    </div>
                    <button className="btn btn-outline">Pause Agent</button>
                </div>
                 <div className="danger-zone-item">
                    <div>
                        <strong>Delete Account</strong>
                        <p>Permanently delete your account and all associated data.</p>
                    </div>
                    <button className="btn btn-outline danger-btn">Delete Account</button>
                </div>
            </div>
        </div>
    );
}