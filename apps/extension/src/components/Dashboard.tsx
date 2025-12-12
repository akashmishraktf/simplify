import React, { useEffect, useState } from 'react';
import { getProfile, logout } from '../utils/api';
import ProfileForm from './ProfileForm';
import ApplicationHistory from './ApplicationHistory';

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

    if (loading) return <div style={{ padding: '16px', color: '#475569' }}>Loading your workspace…</div>;

    const tabStyle = (isActive) => ({
        padding: '10px 14px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        borderRadius: '10px',
        border: '1px solid transparent',
        background: isActive ? 'linear-gradient(135deg, #ede9fe, #e0e7ff)' : '#f8fafc',
        color: isActive ? '#4338ca' : '#475569',
        boxShadow: isActive ? '0 6px 12px rgba(67,56,202,0.12)' : 'none',
        transition: 'all 0.2s ease',
    });

    return (
        <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 12, color: '#475569' }}>Signed in as</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                        {profile?.email || 'Unknown user'}
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '10px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        background: '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontWeight: 700,
                    }}
                >
                    Logout
                </button>
            </div>

            <div style={{
                display: 'flex',
                gap: '10px',
                padding: '8px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
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
            </div>

            <div style={{ padding: '4px 0' }}>
                {activeTab === 'profile' ? (
                    <ProfileForm profile={profile} onUpdate={fetchProfile} />
                ) : (
                    <ApplicationHistory />
                )}
            </div>
        </div>
    );
};

export default Dashboard;
