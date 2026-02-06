import React, { useEffect, useState } from 'react';
import { getApplications, updateApplicationStatus, deleteApplication } from '../utils/api';
import { theme } from '../utils/theme';

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
        return <div style={{ padding: '12px', color: theme.colors.textSecondary }}>Loading applications…</div>;
    }

    if (applications.length === 0) {
        return (
            <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: theme.colors.textSecondary,
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px dashed ${theme.colors.border}`,
                marginTop: '16px'
            }}>
                <p style={{ fontSize: '15px', margin: 0, fontWeight: 500, color: theme.colors.text }}>No applications yet.</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>
                    Visit a job portal and use the autofill button to start tracking.
                </p>
            </div>
        );
    }

    const statusColors = {
        applied: theme.colors.info,
        interviewing: theme.colors.warning,
        accepted: theme.colors.success,
        rejected: theme.colors.danger,
    };

    return (
        <div style={{ display: 'grid', gap: '16px', paddingBottom: '20px' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border}`
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: theme.colors.text }}>Application history</h3>
                <span style={{
                    padding: '4px 10px',
                    borderRadius: theme.borderRadius.full,
                    background: 'rgba(99, 102, 241, 0.1)',
                    color: theme.colors.primary,
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
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.lg,
                        padding: '16px',
                        backgroundColor: theme.colors.bgSecondary,
                        boxShadow: theme.shadows.sm,
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                    }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 8 }}>
                                <div style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: theme.borderRadius.md,
                                    background: theme.colors.bg,
                                    color: theme.colors.primary,
                                    display: 'grid',
                                    placeItems: 'center',
                                    fontWeight: 700,
                                    fontSize: 16,
                                    border: `1px solid ${theme.colors.border}`
                                }}>
                                    {(app.company || 'Job')[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h4 style={{
                                        margin: 0,
                                        fontSize: '16px',
                                        color: theme.colors.text,
                                        fontWeight: 600,
                                    }}>
                                        {app.jobTitle || 'Job Application'}
                                    </h4>
                                    <p style={{
                                        margin: '4px 0 0',
                                        fontSize: '13px',
                                        color: theme.colors.textSecondary,
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
                                    fontSize: '13px',
                                    color: theme.colors.primary,
                                    textDecoration: 'none',
                                    wordBreak: 'break-all',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '8px',
                                    fontWeight: 500
                                }}
                            >
                                View job ↗
                            </a>
                        </div>
                        <button
                            onClick={() => handleDelete(app.id)}
                            style={{
                                padding: '8px 12px',
                                fontSize: '12px',
                                backgroundColor: 'transparent',
                                color: theme.colors.textSecondary,
                                border: `1px solid ${theme.colors.border}`,
                                borderRadius: theme.borderRadius.md,
                                cursor: 'pointer',
                                alignSelf: 'flex-start',
                                transition: 'all 0.2s',
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
                            Delete
                        </button>
                    </div>

                    <hr style={{ border: 'none', borderTop: `1px solid ${theme.colors.border}`, margin: '16px 0' }} />

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: theme.colors.textSecondary,
                            padding: '6px 10px',
                            background: theme.colors.bg,
                            borderRadius: theme.borderRadius.md,
                            border: `1px solid ${theme.colors.border}`,
                        }}>
                            Applied on {new Date(app.dateApplied).toLocaleDateString()}
                        </span>

                        <div style={{ position: 'relative' }}>
                            <select
                                value={app.status}
                                onChange={(e) => handleStatusChange(app.id, e.target.value)}
                                style={{
                                    padding: '8px 32px 8px 12px',
                                    fontSize: '12px',
                                    border: 'none',
                                    borderRadius: theme.borderRadius.md,
                                    backgroundColor: statusColors[app.status] || theme.colors.textSecondary,
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    appearance: 'none',
                                    minWidth: '120px'
                                }}
                            >
                                <option value="applied">Applied</option>
                                <option value="interviewing">Interviewing</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <span style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'white',
                                fontSize: '10px',
                                pointerEvents: 'none'
                            }}>▼</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ApplicationHistory;