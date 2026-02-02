import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // Prevents auth flicker

    // Restore session from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('knotic_token');
        const savedUser = localStorage.getItem('knotic_user');

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (err) {
                // Invalid JSON in localStorage, clear it
                localStorage.removeItem('knotic_token');
                localStorage.removeItem('knotic_user');
            }
        }
        setLoading(false);
    }, []);

    // Login function
    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        // Backend returns { success, message, data: { token, user } }
        const { token: newToken, user: userData } = response.data.data;

        // Save to state
        setToken(newToken);
        setUser(userData);

        // Persist to localStorage
        localStorage.setItem('knotic_token', newToken);
        localStorage.setItem('knotic_user', JSON.stringify(userData));

        return response.data;
    };

    // Register function
    const register = async (name, email, password) => {
        const response = await api.post('/auth/register', { name, email, password });
        // Backend returns { success, message, data: { token, user } }
        const { token: newToken, user: userData } = response.data.data;

        // Save to state
        setToken(newToken);
        setUser(userData);

        // Persist to localStorage
        localStorage.setItem('knotic_token', newToken);
        localStorage.setItem('knotic_user', JSON.stringify(userData));

        return response.data;
    };

    // Logout function
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('knotic_token');
        localStorage.removeItem('knotic_user');
    };

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        setUser,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
