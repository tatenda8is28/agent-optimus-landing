// src/LoginPage.jsx

import { useState } from 'react';
import { auth } from './firebaseClient';
import { sendSignInLinkToEmail } from 'firebase/auth';
import logo from './assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setMessage('');

            const actionCodeSettings = {
                // This is the URL where the user will be redirected back to after
                // clicking the link in their email.
                url: `${window.location.origin}/dashboard`,
                handleCodeInApp: true,
            };
            
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            
            // We save the email in local storage to be used when the user returns
            window.localStorage.setItem('emailForSignIn', email);
            setMessage('Success! Check your email for the magic login link.');

        } catch (error) {
            console.error(error);
            setMessage(error.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="wizard-container">
            <header className="wizard-header">
                <Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link>
            </header>
            <div className="wizard-content" style={{textAlign: 'center'}}>
                <h1>Agent Dashboard Login</h1>
                <p>Enter your email below to receive a secure, passwordless login link.</p>
                <form onSubmit={handleLogin}>
                    <div className="wizard-form-group">
                        <input
                            type="email"
                            placeholder="e.g. jane@realestate.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="wizard-form-group input"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary full-width" disabled={loading}>
                        {loading ? 'Sending Link...' : 'Send Magic Link'}
                    </button>
                </form>
                {message && <p style={{marginTop: '16px'}}>{message}</p>}
            </div>
        </div>
    );
}