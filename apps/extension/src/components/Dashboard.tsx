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

    if (loading) return <div style={{ padding: '10px' }}>Loading...</div>;

    const tabStyle = (isActive) => ({
        flex: 1,
        padding: '10px',
        fontSize: '12px',
        fontWeight: isActive ? 'bold' : 'normal',
        cursor: 'pointer',
        backgroundColor: isActive ? 'white' : '#f5f5f5',
        border: 'none',
        borderBottom: isActive ? '2px solid #667eea' : '1px solid #ddd',
        transition: 'all 0.2s',
    });

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                borderBottom: '1px solid #ddd',
                backgroundColor: '#667eea',
                color: 'white',
            }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    {profile?.email}
                </span>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid white',
                        borderRadius: '3px',
                    }}
                >
                    Logout
                </button>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
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

            {activeTab === 'profile' ? (
                <ProfileForm profile={profile} onUpdate={fetchProfile} />
            ) : (
                <ApplicationHistory />
            )}
        </div>
    );
};

export default Dashboard;
