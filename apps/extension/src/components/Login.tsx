import React, { useState } from 'react';
import { login, register } from '../utils/api';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSignup, setIsSignup] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isSignup) {
                await register(email, password);
            } else {
                await login(email, password);
            }
            onLoginSuccess();
        } catch (err) {
            setError(isSignup ? 'Registration failed. User may already exist.' : 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 16px',
        marginBottom: '16px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        fontSize: '15px',
        background: '#f8fafc',
        boxSizing: 'border-box',
        color: '#334155',
        transition: 'all 0.2s',
        outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        fontWeight: 600,
        color: '#334155',
        marginBottom: 6,
        display: 'block',
    };

    return (
        <div style={{ padding: '8px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 24, color: '#0f172a', fontWeight: 800 }}>
                    {isSignup ? 'Create account' : 'Welcome back'}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>
                    {isSignup ? 'Start automating your job applications today.' : 'Sign in to sync your profile and settings.'}
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid' }}>
                <div>
                    <label style={labelStyle}>Email address</label>
                    <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={fieldStyle}
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
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
                        onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                        onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        color: '#fff',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: loading ? 'wait' : 'pointer',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
                        opacity: loading ? 0.8 : 1,
                        transition: 'transform 0.1s',
                        marginTop: '8px'
                    }}
                    onMouseDown={(e) => !loading && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            {error && (
                <div style={{ 
                    marginTop: '16px', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: '#fef2f2', 
                    color: '#dc2626', 
                    fontSize: '13px', 
                    textAlign: 'center',
                    border: '1px solid #fee2e2'
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginTop: '24px', fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                {isSignup ? 'Already have an account?' : "New to Simplify?"}{' '}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        setIsSignup(!isSignup);
                        setError('');
                    }}
                    style={{ 
                        background: 'none', 
                        border: 'none', 
                        color: '#4f46e5', 
                        fontWeight: 700, 
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 'inherit'
                    }}
                >
                    {isSignup ? 'Log in' : 'Sign up'}
                </button>
            </div>
        </div>
    );
};

export default Login;
