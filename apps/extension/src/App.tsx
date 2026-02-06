import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { theme } from './utils/theme';

declare const chrome: any;

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

    const pageStyle: React.CSSProperties = {
        minHeight: '100vh',
        background: theme.colors.bg,
        fontFamily: theme.fonts.body,
        color: theme.colors.text,
        display: 'flex',
        flexDirection: 'column',
    };

    const headerStyle: React.CSSProperties = {
        padding: '16px 24px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.bgSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
    };

    const brandStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    };

    const logoStyle: React.CSSProperties = {
        width: 32,
        height: 32,
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: '14px',
    };

    const containerStyle: React.CSSProperties = {
        flex: 1,
        width: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '24px',
        boxSizing: 'border-box',
    };

    if (loading) {
        return (
            <div style={{ ...pageStyle, justifyContent: 'center', alignItems: 'center' }}>
                <style>{`
                    body { margin: 0; padding: 0; background: ${theme.colors.bg}; }
                    * { box-sizing: border-box; }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
                <div style={{ 
                    width: 32, 
                    height: 32, 
                    borderRadius: '50%', 
                    border: `3px solid ${theme.colors.border}`, 
                    borderTopColor: theme.colors.primary, 
                    animation: 'spin 1s linear infinite' 
                }} />
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <style>{`
                body { margin: 0; padding: 0; background: ${theme.colors.bg}; }
                * { box-sizing: border-box; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
            <header style={headerStyle}>
                <div style={brandStyle}>
                    <div style={logoStyle}>SfI</div>
                    <span style={{ fontWeight: 600, fontSize: '16px', letterSpacing: '-0.01em' }}>Simplify for India</span>
                </div>
                {isAuthenticated && (
                    <div style={{ 
                        fontSize: '12px', 
                        color: theme.colors.success, 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        padding: '4px 12px', 
                        borderRadius: '99px',
                        fontWeight: 600 
                    }}>
                        Connected
                    </div>
                )}
            </header>

            <main style={containerStyle}>
                {isAuthenticated ? (
                    <Dashboard onLogout={handleLogout} />
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        minHeight: '60vh' 
                    }}>
                        <div style={{ maxWidth: '400px', width: '100%' }}>
                            <Login onLoginSuccess={handleLoginSuccess} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default App;