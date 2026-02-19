import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * AuthContext – provides user authentication state across the app.
 * 
 * Stores JWT token in localStorage and exposes:
 *   - user: { id, name, email, role }
 *   - token: JWT string
 *   - login(userData, token): store credentials
 *   - logout(): clear credentials
 *   - isAuthenticated: boolean
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('scriptsense_token');
        const storedUser = localStorage.getItem('scriptsense_user');
        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('scriptsense_token');
                localStorage.removeItem('scriptsense_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('scriptsense_token', jwtToken);
        localStorage.setItem('scriptsense_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('scriptsense_token');
        localStorage.removeItem('scriptsense_user');
    };

    const value = {
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        role: user?.role || null,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}

export default AuthContext;
