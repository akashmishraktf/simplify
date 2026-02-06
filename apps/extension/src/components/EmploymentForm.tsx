import React, { useState } from 'react';
import { theme } from '../utils/theme';

const EmploymentForm = ({ employment = [], onChange }) => {
    const [jobs, setJobs] = useState(employment.length > 0 ? employment : [{
        company: '',
        title: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
    }]);

    const handleJobChange = (index, field, value) => {
        const newJobs = [...jobs];
        newJobs[index][field] = value;
        setJobs(newJobs);
        onChange(newJobs);
    };

    const addJob = () => {
        const newJobs = [...jobs, {
            company: '',
            title: '',
            startDate: '',
            endDate: '',
            current: false,
            description: '',
        }];
        setJobs(newJobs);
        onChange(newJobs);
    };

    const removeJob = (index) => {
        const newJobs = jobs.filter((_, i) => i !== index);
        setJobs(newJobs);
        onChange(newJobs);
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 14px',
        marginBottom: '14px',
        boxSizing: 'border-box' as const,
        fontSize: '14px',
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
        background: theme.colors.inputBg,
        color: theme.colors.text,
        transition: 'all 0.2s',
        outline: 'none',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: 600 as const,
        marginBottom: '6px',
        marginTop: '8px',
        color: theme.colors.textSecondary,
    };

    const cardStyle = {
        border: `1px solid ${theme.colors.border}`,
        padding: '16px',
        marginBottom: '16px',
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.bgSecondary,
    };

    return (
        <div>
            <h4 style={{ margin: '24px 0 12px 0', fontSize: '16px', color: theme.colors.text }}>Employment History</h4>
            {jobs.map((job, index) => (
                <div key={index} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.text }}>Job {index + 1}</span>
                        {jobs.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeJob(index)}
                                style={{
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    backgroundColor: 'transparent',
                                    color: theme.colors.danger,
                                    border: `1px solid ${theme.colors.danger}`,
                                    borderRadius: theme.borderRadius.md,
                                    cursor: 'pointer',
                                }}
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <label style={labelStyle}>Company</label>
                    <input
                        type="text"
                        value={job.company}
                        onChange={(e) => handleJobChange(index, 'company', e.target.value)}
                        placeholder="Google"
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Job Title</label>
                    <input
                        type="text"
                        value={job.title}
                        onChange={(e) => handleJobChange(index, 'title', e.target.value)}
                        placeholder="Software Engineer"
                        style={inputStyle}
                    />

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Start Date</label>
                            <input
                                type="month"
                                value={job.startDate}
                                onChange={(e) => handleJobChange(index, 'startDate', e.target.value)}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>End Date</label>
                            <input
                                type="month"
                                value={job.endDate}
                                onChange={(e) => handleJobChange(index, 'endDate', e.target.value)}
                                disabled={job.current}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                        <input
                            type="checkbox"
                            checked={job.current}
                            onChange={(e) => handleJobChange(index, 'current', e.target.checked)}
                            style={{ margin: 0 }}
                        />
                        Currently working here
                    </label>

                    <label style={labelStyle}>Description (optional)</label>
                    <textarea
                        value={job.description}
                        onChange={(e) => handleJobChange(index, 'description', e.target.value)}
                        placeholder="Key responsibilities and achievements"
                        rows={3}
                        style={{ ...inputStyle, resize: 'vertical' as const }}
                    />
                </div>
            ))}

            <button
                type="button"
                onClick={addJob}
                style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    color: theme.colors.primary,
                    border: `1px dashed ${theme.colors.primary}`,
                    borderRadius: theme.borderRadius.md,
                    cursor: 'pointer',
                    fontWeight: 600,
                }}
            >
                + Add Another Job
            </button>
        </div>
    );
};

export default EmploymentForm;