// src/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ children }) {
    const { user } = useAuth();

    // If there is no logged-in user, redirect them to the login page
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If there is a user, render the child component (the DashboardPage)
    return children;
}