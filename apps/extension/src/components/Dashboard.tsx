import React, { useEffect, useState } from 'react';
import { getProfile, logout } from '../utils/api';
import ProfileForm from './ProfileForm';
import ApplicationHistory from './ApplicationHistory';
import QABank from './QABank';
import Settings from './Settings';

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

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading your workspace…</div>;

    const tabStyle = (isActive) => ({
        flex: 1,
        padding: '10px 6px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
        borderRadius: '8px',
        border: 'none',
        background: isActive ? '#ffffff' : 'transparent',
        color: isActive ? '#4f46e5' : '#64748b',
        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
    });

    return (
        <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #ffffff, #f8fafc)',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca',
                        display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 16
                    }}>
                        {profile?.firstName?.[0] || profile?.email?.[0] || 'U'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                            {profile?.firstName ? `Hi, ${profile.firstName}` : 'Welcome back'}
                        </span>
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                            {profile?.email || 'Unknown user'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: '#fff',
                        color: '#ef4444',
                        border: '1px solid #fee2e2',
                        borderRadius: '8px',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                >
                    Sign out
                </button>
            </div>

            <div style={{
                display: 'flex',
                padding: '4px',
                background: '#f1f5f9',
                borderRadius: '10px',
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

            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
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
