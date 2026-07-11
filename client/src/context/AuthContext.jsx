/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const getStoredUser = () => {
    const savedUser = localStorage.getItem('knotic_user');
    if (!savedUser) return null;

    try {
        return JSON.parse(savedUser);
    } catch {
        localStorage.removeItem('knotic_user');
        return null;
    }
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const loading = false;

    // Login function
    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        // Backend returns { success, message, data: { user, token } }
        // Token is now set as httpOnly cookie by the server
        const { user: userData } = response.data.data;

        setUser(userData);
        localStorage.setItem('knotic_user', JSON.stringify(userData));

        return response.data;
    };

    // Register function
    const register = async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        const { user: userData } = response.data.data;

        setUser(userData);
        localStorage.setItem('knotic_user', JSON.stringify(userData));

        return response.data;
    };

    // Logout function
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch {
            // Even if server call fails, clear local state
        }
        setUser(null);
        localStorage.removeItem('knotic_user');
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        setUser: (userData) => {
            setUser(userData);
            if (userData) {
                localStorage.setItem('knotic_user', JSON.stringify(userData));
            }
        },
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
