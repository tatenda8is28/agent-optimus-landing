// src/AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();

    // While we're checking the user's auth state and claims, show a loading message.
    if (loading) {
        return <div>Verifying access...</div>;
    }

    // If the user is logged in AND they are an admin, let them through.
    if (user && isAdmin) {
        return children;
    }

    // Otherwise, redirect them to the regular dashboard or login page.
    return <Navigate to="/dashboard" replace />;
}