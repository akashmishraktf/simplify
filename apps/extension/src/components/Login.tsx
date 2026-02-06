import React, { useState } from 'react';
import { login, register } from '../utils/api';
import { theme } from '../utils/theme';

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

    const cardStyle: React.CSSProperties = {
        background: theme.colors.bgSecondary,
        padding: '32px',
        borderRadius: theme.borderRadius.xl,
        border: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.lg,
    };

    const fieldStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        marginBottom: '16px',
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
        fontSize: '15px',
        background: theme.colors.inputBg,
        boxSizing: 'border-box',
        color: theme.colors.text,
        transition: 'all 0.2s',
        outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        fontWeight: 600,
        color: theme.colors.textSecondary,
        marginBottom: 8,
        display: 'block',
    };

    return (
        <div style={cardStyle}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 24, color: theme.colors.text, fontWeight: 700 }}>
                    {isSignup ? 'Create account' : 'Welcome back'}
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
                    {isSignup ? 'Start automating your job applications today.' : 'Sign in to sync your profile and settings.'}
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                <div>
                    <label style={labelStyle}>Email address</label>
                    <input
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={fieldStyle}
                        onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                        onBlur={(e) => e.target.style.borderColor = theme.colors.border}
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
                        onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                        onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: theme.borderRadius.md,
                        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
                        color: '#fff',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: loading ? 'wait' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'opacity 0.2s',
                        marginTop: '8px'
                    }}
                >
                    {loading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
                </button>
            </form>

            {error && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '12px', 
                    borderRadius: theme.borderRadius.md, 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: theme.colors.danger, 
                    fontSize: '13px', 
                    textAlign: 'center',
                    border: `1px solid ${theme.colors.danger}33`
                }}>
                    {error}
                </div>
            )}

            <div style={{ marginTop: '24px', fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center' }}>
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
                        color: theme.colors.primary, 
                        fontWeight: 600, 
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