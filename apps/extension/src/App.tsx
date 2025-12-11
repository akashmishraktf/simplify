import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        chrome.storage.local.get(['access_token'], (result) => {
            if (result.access_token) {
                setIsAuthenticated(true);
            }
            setLoading(false);
        });
    }, []);

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ width: '300px', padding: '10px' }}>
            <h1>Simplify for India</h1>
            {isAuthenticated ? (
                <Dashboard onLogout={handleLogout} />
            ) : (
                <Login onLoginSuccess={handleLoginSuccess} />
            )}
        </div>
    );
};

export default App;
