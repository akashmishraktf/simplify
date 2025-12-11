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
        return <div style={{ padding: '10px' }}>Loading applications...</div>;
    }

    if (applications.length === 0) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                <p style={{ fontSize: '12px' }}>No applications yet.</p>
                <p style={{ fontSize: '11px', marginTop: '10px' }}>
                    Visit a job portal and use the autofill button to apply for jobs!
                </p>
            </div>
        );
    }

    const statusColors = {
        applied: '#2196F3',
        interviewing: '#FF9800',
        accepted: '#4CAF50',
        rejected: '#f44336',
    };

    return (
        <div style={{ maxHeight: '400px', overflowY: 'auto', padding: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Application History</h3>

            {applications.map((app) => (
                <div
                    key={app.id}
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        padding: '10px',
                        marginBottom: '10px',
                        backgroundColor: '#f9f9f9',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                    }}>
                        <div style={{ flex: 1 }}>
                            <h4 style={{
                                margin: '0 0 4px 0',
                                fontSize: '13px',
                                fontWeight: 'bold',
                            }}>
                                {app.jobTitle || 'Job Application'}
                            </h4>
                            <p style={{
                                margin: '0 0 4px 0',
                                fontSize: '12px',
                                color: '#666',
                            }}>
                                {app.company || new URL(app.url).hostname}
                            </p>
                            <a
                                href={app.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    fontSize: '10px',
                                    color: '#0066cc',
                                    textDecoration: 'none',
                                    wordBreak: 'break-all',
                                }}
                            >
                                View Job →
                            </a>
                        </div>
                        <button
                            onClick={() => handleDelete(app.id)}
                            style={{
                                padding: '2px 6px',
                                fontSize: '10px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                            }}
                        >
                            Delete
                        </button>
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '10px',
                    }}>
                        <span style={{
                            fontSize: '10px',
                            color: '#999',
                        }}>
                            {new Date(app.dateApplied).toLocaleDateString()}
                        </span>

                        <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            style={{
                                padding: '4px 8px',
                                fontSize: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: statusColors[app.status] || '#999',
                                color: 'white',
                                cursor: 'pointer',
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

            <div style={{
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#1976d2',
            }}>
                <strong>Total Applications:</strong> {applications.length}
            </div>
        </div>
    );
};

export default ApplicationHistory;
