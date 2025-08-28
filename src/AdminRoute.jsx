// src/AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function AdminRoute({ children }) {
    const { user, isAdmin, loading } = useAuth(); // Renamed for clarity

    if (loading) {
        return <div>Verifying access...</div>;
    }

    if (user && isAdmin) {
        return children;
    }

    return <Navigate to="/dashboard" replace />;
}