import React, { useEffect, useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

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

    const scrollToWorkspace = () => {
        document.getElementById('workspace')?.scrollIntoView({ behavior: 'smooth' });
    };

    const pageStyle: React.CSSProperties = {
        minHeight: '100vh',
        background: 'radial-gradient(circle at 20% 20%, #eef2ff, #f8fafc 40%), radial-gradient(circle at 80% 0%, #e0f2fe, #f8fafc 40%)',
        padding: '32px 18px 48px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        color: '#0f172a',
    };

    const cardStyle: React.CSSProperties = {
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        border: '1px solid #e2e8f0',
    };

    if (loading) {
        return (
            <div style={pageStyle}>
                <div style={{ ...cardStyle, padding: '40px', textAlign: 'center' }}>
                    <div style={{ width: 28, height: 28, margin: '0 auto 12px', borderRadius: '50%', border: '3px solid #cbd5e1', borderTopColor: '#6366f1', animation: 'spin 1s linear infinite' }} />
                    <div style={{ fontSize: 14, color: '#475569' }}>Booting up your workspace…</div>
                </div>
            </div>
        );
    }

    return (
        <div style={pageStyle}>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            <div style={{ ...cardStyle, padding: '22px 20px', marginBottom: '18px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                }}>
                    SfI
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, letterSpacing: '0.03em', color: '#6366f1', fontWeight: 700 }}>FULL-PAGE EXTENSION</div>
                    <h1 style={{ margin: '4px 0 6px', fontSize: 22, lineHeight: 1.3, color: '#0f172a' }}>
                        Autofill, track, and polish your applications in one clean view.
                    </h1>
                    <p style={{ margin: 0, color: '#475569', fontSize: 13 }}>
                        Works across job boards. Profile + history + controls in a dedicated tab for faster editing.
                    </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: 190, alignItems: 'flex-end' }}>
                    <div style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        background: isAuthenticated ? 'rgba(34,197,94,0.12)' : 'rgba(251,146,60,0.12)',
                        color: isAuthenticated ? '#15803d' : '#c2410c',
                        fontSize: 12,
                        fontWeight: 600,
                        border: `1px solid ${isAuthenticated ? '#bbf7d0' : '#fed7aa'}`,
                    }}>
                        {isAuthenticated ? 'Signed in' : 'Guest mode'}
                    </div>
                    <button
                        onClick={scrollToWorkspace}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '12px',
                            border: '1px solid #c7d2fe',
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 13,
                            cursor: 'pointer',
                            boxShadow: '0 8px 18px rgba(79,70,229,0.25)',
                        }}
                    >
                        Jump to workspace
                    </button>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(280px, 0.9fr) 1.6fr',
                gap: '16px',
                alignItems: 'start',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Quick overview</div>
                            <span style={{ fontSize: 11, color: '#6366f1', fontWeight: 700 }}>Built for speed</span>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 16, color: '#475569', fontSize: 13, display: 'grid', gap: '6px' }}>
                            <li>Profile, application history, and autofill switches side-by-side.</li>
                            <li>Persistent tab prevents popup limits—resize, scroll, and keep context.</li>
                            <li>Safer saves: clearer status to avoid duplicate submissions.</li>
                        </ul>
                    </div>

                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Setup in three steps</div>
                        <ol style={{ margin: 0, paddingLeft: 18, color: '#475569', fontSize: 13, display: 'grid', gap: '6px' }}>
                            <li>{isAuthenticated ? 'Review your profile fields below.' : 'Sign in or create an account to sync your profile.'}</li>
                            <li>Toggle autofill fields and dry-run mode to match each site.</li>
                            <li>Visit a job post and trigger autofill from the toolbar.</li>
                        </ol>
                    </div>

                    <div style={{ ...cardStyle, padding: '16px' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Need help?</div>
                        <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.5 }}>
                            Drop feedback in your usual channel. We’ll keep polishing the tab-first experience and add keyboard shortcuts next.
                        </div>
                    </div>
                </div>

                <div id="workspace" style={{ ...cardStyle, padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', color: '#6366f1' }}>
                                WORKSPACE
                            </div>
                            <h2 style={{ margin: '4px 0 2px', fontSize: 20, color: '#0f172a' }}>
                                {isAuthenticated ? 'Profile & applications' : 'Sign in to manage your profile'}
                            </h2>
                            <p style={{ margin: 0, color: '#64748b', fontSize: 13 }}>
                                {isAuthenticated ? 'Update once, reuse everywhere. Your changes save to the cloud.' : 'Create an account to sync data across tabs and job sites.'}
                            </p>
                        </div>
                        <div style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            border: '1px dashed #cbd5e1',
                            color: '#475569',
                            fontSize: 12,
                            fontWeight: 600,
                        }}>
                            Opens in its own tab
                        </div>
                    </div>

                    {isAuthenticated ? (
                        <Dashboard onLogout={handleLogout} />
                    ) : (
                        <Login onLoginSuccess={handleLoginSuccess} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;
