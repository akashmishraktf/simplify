import React, { useEffect, useState } from 'react';
import { getProfile, logout } from '../utils/api';
import ProfileForm from './ProfileForm';
import ApplicationHistory from './ApplicationHistory';
import QABank from './QABank';
import Settings from './Settings';
import { theme } from '../utils/theme';

const Dashboard = ({ onLogout }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    const fetchProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await logout();
        onLogout();
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: theme.colors.textSecondary }}>Loading your workspace…</div>;

    const tabStyle = (isActive) => ({
        padding: '10px 16px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        borderRadius: theme.borderRadius.md,
        border: 'none',
        background: isActive ? theme.colors.primary : 'transparent',
        color: isActive ? '#ffffff' : theme.colors.textSecondary,
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
            {/* Header Area */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 8px'
            }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: '50%', background: theme.colors.bgSecondary, color: theme.colors.primary,
                        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 18,
                        border: `1px solid ${theme.colors.border}`
                    }}>
                        {profile?.firstName?.[0] || profile?.email?.[0] || 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: theme.colors.text }}>
                            {profile?.firstName ? `Hi, ${profile.firstName}` : 'Welcome back'}
                        </span>
                        <span style={{ fontSize: 13, color: theme.colors.textSecondary }}>
                            {profile?.email || 'Unknown user'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        fontSize: '13px',
                        cursor: 'pointer',
                        background: 'transparent',
                        color: theme.colors.textSecondary,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        fontWeight: 500,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.color = theme.colors.danger;
                        e.currentTarget.style.borderColor = theme.colors.danger;
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.color = theme.colors.textSecondary;
                        e.currentTarget.style.borderColor = theme.colors.border;
                    }}
                >
                    Sign out
                </button>
            </div>

            {/* Navigation */}
            <div style={{
                display: 'flex',
                gap: '8px',
                borderBottom: `1px solid ${theme.colors.border}`,
                paddingBottom: '16px'
            }}>
                <button
                    style={tabStyle(activeTab === 'profile')}
                    onClick={() => setActiveTab('profile')}
                >
                    Profile
                </button>
                <button
                    style={tabStyle(activeTab === 'applications')}
                    onClick={() => setActiveTab('applications')}
                >
                    Applications
                </button>
                <button
                    style={tabStyle(activeTab === 'qabank')}
                    onClick={() => setActiveTab('qabank')}
                >
                    Q&A Bank
                </button>
                <button
                    style={tabStyle(activeTab === 'settings')}
                    onClick={() => setActiveTab('settings')}
                >
                    Settings
                </button>
            </div>

            {/* Content Area */}
            <div style={{ animation: 'fadeIn 0.3s ease-out', flex: 1 }}>
                <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                {activeTab === 'profile' && (
                    <ProfileForm profile={profile} onUpdate={fetchProfile} />
                )}
                {activeTab === 'applications' && (
                    <ApplicationHistory />
                )}
                {activeTab === 'qabank' && (
                    <QABank />
                )}
                {activeTab === 'settings' && (
                    <Settings />
                )}
            </div>
        </div>
    );
};

export default Dashboard;