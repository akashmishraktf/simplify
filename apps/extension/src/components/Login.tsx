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

    return (
        <div>
            <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box' }}
                />
                <button type="submit" style={{ width: '100%', padding: '10px', marginBottom: '10px' }}>
                    {isSignup ? 'Sign Up' : 'Login'}
                </button>
            </form>
            {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
            <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '10px' }}>
                {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
                <a
                    href="#"
                    onClick={(e) => {
                        e.preventDefault();
                        setIsSignup(!isSignup);
                        setError('');
                    }}
                    style={{ color: '#0066cc' }}
                >
                    {isSignup ? 'Login' : 'Sign Up'}
                </a>
            </p>
        </div>
    );
};

export default Login;
