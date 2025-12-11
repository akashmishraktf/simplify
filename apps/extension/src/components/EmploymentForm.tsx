import React, { useState } from 'react';

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
        padding: '6px',
        marginBottom: '8px',
        boxSizing: 'border-box' as const,
        fontSize: '12px',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '11px',
        fontWeight: 'bold' as const,
        marginBottom: '3px',
        marginTop: '5px',
    };

    return (
        <div>
            <h4 style={{ margin: '10px 0 5px 0', fontSize: '13px' }}>Employment History</h4>
            {jobs.map((job, index) => (
                <div key={index} style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Job {index + 1}</span>
                        {jobs.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeJob(index)}
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

                    <div style={{ display: 'flex', gap: '10px' }}>
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

                    <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={job.current}
                            onChange={(e) => handleJobChange(index, 'current', e.target.checked)}
                            style={{ marginRight: '5px' }}
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
                    padding: '6px',
                    fontSize: '11px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                }}
            >
                + Add Another Job
            </button>
        </div>
    );
};

export default EmploymentForm;
