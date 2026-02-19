import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute – wraps routes that require authentication.
 * 
 * Props:
 *   - children: the component to render if authorized
 *   - requiredRole: optional role string ('custodian' | 'faculty')
 *                   if omitted, any authenticated user is allowed
 * 
 * Redirects to /login if not authenticated.
 * Redirects to /unauthorized if role doesn't match.
 */
export default function ProtectedRoute({ children, requiredRole }) {
    const { isAuthenticated, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && role !== requiredRole) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
}
