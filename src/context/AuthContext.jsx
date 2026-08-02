import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Sync state on load
    useEffect(() => {
        async function initializeAuth() {
            const savedToken = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (savedToken) {
                try {
                    // Try to fetch fresh user profile from backend
                    const response = await fetch('http://127.0.0.1:5000/api/profile', {
                        headers: {
                            'Authorization': `Bearer ${savedToken}`
                        }
                    });
                    if (response.ok) {
                        const userData = await response.json();
                        const role = savedUser ? JSON.parse(savedUser).role : 'citizen';
                        const normalizedUser = { ...userData, uid: userData.id, role };
                        
                        localStorage.setItem('user', JSON.stringify(normalizedUser));
                        setCurrentUser(normalizedUser);
                        setToken(savedToken);
                    } else {
                        if (savedUser) {
                            setCurrentUser(JSON.parse(savedUser));
                        } else {
                            setCurrentUser(null);
                        }
                    }
                } catch (error) {
                    if (savedUser) {
                        setCurrentUser(JSON.parse(savedUser));
                    } else {
                        setCurrentUser(null);
                    }
                }
            } else {
                if (savedUser) {
                    setCurrentUser(JSON.parse(savedUser));
                } else {
                    setCurrentUser(null);
                }
            }
            setLoading(false);
        }
        initializeAuth();
    }, []);

    async function signupWithEmail(email, password, role = 'citizen', username = '', department = '', phone = '') {
        try {
            let result;
            if (role === 'authority') {
                result = await api.authoritySignup(email, password, username, department, phone);
            } else {
                result = await api.userSignup(email, password, username, phone);
            }
            
            // Re-login immediately after signup to get token
            const loginResult = await loginUser(username || email, password, role);
            return loginResult;
        } catch (error) {
            console.error("Signup error:", error);
            throw new Error(error.message || "Failed to create account");
        }
    }

    async function loginUser(emailOrUsername, password, role = 'citizen') {
        try {
            let result;
            if (role === 'authority') {
                result = await api.authorityLogin(emailOrUsername, password);
            } else {
                result = await api.userLogin(emailOrUsername, password);
            }

            const { access_token, user } = result;
            const normalizedUser = { ...user, uid: user.id };
            
            handleAuthSuccess(access_token, normalizedUser);
            return { user: normalizedUser, access_token };
        } catch (error) {
            console.error("Login error:", error);
            throw new Error(error.message || "Failed to login");
        }
    }

    function handleAuthSuccess(accessToken, userData) {
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(accessToken);
        setCurrentUser(userData);
    }

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setCurrentUser(null);
    }

    function updateUser(userData) {
        const userToStore = { ...userData, uid: userData.id || userData.uid };
        localStorage.setItem('user', JSON.stringify(userToStore));
        setCurrentUser(userToStore);
    }

    const value = {
        currentUser,
        token,
        signupWithEmail,
        loginUser,
        logout,
        updateUser
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-lg font-semibold tracking-wide">Initializing System...</p>
                    </div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
}
