import axios, { AxiosError } from 'axios';
import React, { useState } from 'react';
import '../styles/LoginForm.css';

interface LoginFormProps {
    onLogin: () => void;
}

interface LoginResponse {
    token: string;
}

interface ErrorResponse {
    error?: string;
    message?: string;
}

const baseUrl = import.meta.env.VITE_API_URL;

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [validatePassword, setValidatePassword] = useState('');
    const [mode, setMode] = useState<'login' | 'register'>('login');

    const showAlert = (message: string) => alert(message);

    const handleLogin = async () => {
        try {
            const { data } = await axios.post<LoginResponse>(
                `${baseUrl}/api/auth/login`,
                {
                    username,
                    password,
                }
            );
            localStorage.setItem('token', data.token);
            onLogin();
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            const message =
                axiosError.response?.data?.error || axiosError.message;
            console.error('Login error:', message);
            showAlert(`Login error: ${message}`);
        }
    };

    const handleRegister = async () => {
        if (!username.trim()) return showAlert('Username cannot be empty.');
        if (!password) return showAlert('Password cannot be empty.');
        if (password !== validatePassword)
            return showAlert('Passwords do not match.');
        try {
            await axios.post(`${baseUrl}/api/auth/register`, {
                username,
                password,
            });
            showAlert('Registration successful! Please log in.');
            setMode('login');
            setValidatePassword('');
        } catch (error) {
            const axiosError = error as AxiosError<ErrorResponse>;
            const errorMsg = axiosError.response?.data?.error;
            showAlert(
                errorMsg === 'Username already exists'
                    ? 'This username is already taken.'
                    : 'Registration failed. Please try again.'
            );
        }
    };

    const handleAction = () =>
        mode === 'login' ? handleLogin() : handleRegister();
    const toggleMode = () =>
        setMode((prev) => (prev === 'login' ? 'register' : 'login'));

    return (
        <div className="login-form">
            <div id="auth-container">
                <div className="auth-header">
                    <h2 className="auth-title">To Do List</h2>
                </div>
                <div className="form-group">
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        className="form-input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {mode === 'register' && (
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Confirm Password"
                            value={validatePassword}
                            onChange={(e) =>
                                setValidatePassword(e.target.value)
                            }
                        />
                    )}
                    <div className="logger-container">
                        <button
                            className="btn btn-primary"
                            onClick={handleAction}
                        >
                            {mode === 'login' ? 'Login' : 'Register'}
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={toggleMode}
                        >
                            Switch to {mode === 'login' ? 'Register' : 'Login'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
