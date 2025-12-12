import React, { useEffect, useState } from 'react';
import { getApplications, updateApplicationStatus, deleteApplication } from '../utils/api';

const ApplicationHistory = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadApplications = async () => {
        try {
            const data = await getApplications();
            setApplications(data);
        } catch (err) {
            console.error('Failed to load applications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    const handleStatusChange = async (id, status) => {
        try {
            await updateApplicationStatus(id, status);
            loadApplications();
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this application?')) {
            try {
                await deleteApplication(id);
                loadApplications();
            } catch (err) {
                console.error('Failed to delete application:', err);
            }
        }
    };

    if (loading) {
        return <div style={{ padding: '12px', color: '#475569' }}>Loading applications…</div>;
    }

    if (applications.length === 0) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#475569',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px dashed #e2e8f0',
            }}>
                <p style={{ fontSize: '13px', margin: 0 }}>No applications yet.</p>
                <p style={{ fontSize: '12px', marginTop: '6px' }}>
                    Visit a job portal and use the autofill button to start tracking.
                </p>
            </div>
        );
    }

    const statusColors = {
        applied: '#2563eb',
        interviewing: '#f59e0b',
        accepted: '#16a34a',
        rejected: '#dc2626',
    };

    return (
        <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Application history</h3>
                <span style={{
                    padding: '6px 10px',
                    borderRadius: '12px',
                    background: '#eef2ff',
                    color: '#4338ca',
                    fontSize: 12,
                    fontWeight: 700,
                }}>
                    {applications.length} tracked
                </span>
            </div>

            {applications.map((app) => (
                <div
                    key={app.id}
                    style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '14px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 4 }}>
                                <div style={{
                                    width: 38,
                                    height: 38,
                                    borderRadius: '12px',
                                    background: '#eef2ff',
                                    color: '#4338ca',
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: 700,
                                    fontSize: 13,
                                }}>
                                    {(app.company || 'Job')[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h4 style={{
                                        margin: 0,
                                        fontSize: '15px',
                                        color: '#0f172a',
                                        fontWeight: 700,
                                    }}>
                                        {app.jobTitle || 'Job Application'}
                                    </h4>
                                    <p style={{
                                        margin: '2px 0 0',
                                        fontSize: '13px',
                                        color: '#475569',
                                    }}>
                                        {app.company || new URL(app.url).hostname}
                                    </p>
                                </div>
                            </div>

                            <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '12px',
                                    color: '#2563eb',
                                    textDecoration: 'none',
                                    wordBreak: 'break-all',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                }}
                            >
                                View job ↗
                            </a>
                        </div>
                        <button
                            onClick={() => handleDelete(app.id)}
                            style={{
                                padding: '8px 10px',
                                fontSize: '12px',
                                backgroundColor: '#0f172a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                alignSelf: 'flex-start',
                            }}
                        >
                            Delete
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '12px',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: '#475569',
                            padding: '6px 10px',
                            background: '#f8fafc',
                            borderRadius: '10px',
                            border: '1px solid #e2e8f0',
                        }}>
                            Applied on {new Date(app.dateApplied).toLocaleDateString()}
                        </span>

                        <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            style={{
                                padding: '10px 12px',
                                fontSize: '12px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '12px',
                                backgroundColor: statusColors[app.status] || '#475569',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: 700,
                            }}
                        >
                            <option value="applied">Applied</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="accepted">Accepted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApplicationHistory;
