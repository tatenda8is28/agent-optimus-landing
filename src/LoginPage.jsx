// src/LoginPage.jsx

import { useNavigate } from 'react-router-dom';
import { auth } from './firebaseClient';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import logo from './assets/logo.png';
import { Link } from 'react-router-dom';

const GoogleIcon = () => (
    <svg style={{ marginRight: '12px' }} width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.20455C17.64 8.56682 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5618V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"></path><path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5618C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9873 5.48182 18 9 18Z" fill="#34A853"></path><path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29H0.957275C0.347727 8.44818 0 9.71545 0 11.1C0 12.4845 0.347727 13.7518 0.957275 14.91H3.96409V12.5782C3.96409 11.97 3.96409 11.3627 3.96409 10.71V10.71Z" fill="#FBBC05"></path><path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01273 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"></path></svg>
);

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError('');
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // The AuthContext will handle the redirect automatically.
            // We don't need to navigate() here.
        } catch (error) {
            console.error(error);
            setError(error.message || 'Failed to sign in with Google.');
            setLoading(false);
        }
    };

    return (
        <div className="wizard-container">
            <header className="wizard-header"><Link to="/"><img src={logo} alt="Agent Optimus Logo" className="logo-img" /></Link></header>
            <div className="wizard-content" style={{textAlign: 'center'}}>
                <h1>Agent Dashboard Login</h1>
                <p style={{marginBottom: '32px'}}>Sign in to access your Mission Control.</p>
                
                <button onClick={handleGoogleSignIn} className="btn btn-outline full-width" disabled={loading} style={{justifyContent: 'center'}}>
                    <GoogleIcon />
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>
                
                {error && <p style={{marginTop: '16px', color: 'red'}}>{error}</p>}
            </div>
        </div>
    );
}