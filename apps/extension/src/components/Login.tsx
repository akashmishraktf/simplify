import React, { useState } from 'react';
import { login, register } from '../utils/api';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSignup, setIsSignup] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isSignup) {
                await register(email, password);
            } else {
                await login(email, password);
            }
            onLoginSuccess();
        } catch (err) {
            setError(isSignup ? 'Registration failed. User may already exist.' : 'Invalid credentials');
        }
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 14px',
        marginBottom: '12px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        background: '#f8fafc',
        boxSizing: 'border-box',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 700,
        color: '#0f172a',
        marginBottom: 4,
        display: 'block',
    };

    return (
        <div style={{ display: 'grid', gap: '10px' }}>
            <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 18, color: '#0f172a' }}>
                    {isSignup ? 'Create your account' : 'Welcome back'}
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#475569' }}>
                    Use your Simplify for India credentials to sync profile data.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '10px' }}>
                <div>
                    <label style={labelStyle}>Work email</label>
                    <input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={fieldStyle}
                    />
                </div>

                <div>
                    <label style={labelStyle}>Password</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={fieldStyle}
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        boxShadow: '0 10px 25px rgba(79,70,229,0.25)',
                    }}
                >
                    {isSignup ? 'Create account' : 'Sign in'}
                </button>
            </form>

            {error && (
                <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0' }}>
                    {error}
                </p>
            )}

            <div style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsSignup(!isSignup);
                        setError('');
                    }}
                    style={{ color: '#4f46e5', fontWeight: 700 }}
                >
                    {isSignup ? 'Sign in' : 'Create one'}
                </a>
            </div>
        </div>
    );
};

export default Login;
