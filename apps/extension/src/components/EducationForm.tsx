import React, { useState } from 'react';
import { theme } from '../utils/theme';

const EducationForm = ({ education = [], onChange }) => {
    const [degrees, setDegrees] = useState(education.length > 0 ? education : [{
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startYear: '',
        endYear: '',
        grade: '',
    }]);

    const handleDegreeChange = (index, field, value) => {
        const newDegrees = [...degrees];
        newDegrees[index][field] = value;
        setDegrees(newDegrees);
        onChange(newDegrees);
    };

    const addDegree = () => {
        const newDegrees = [...degrees, {
            institution: '',
            degree: '',
            fieldOfStudy: '',
            startYear: '',
            endYear: '',
            grade: '',
        }];
        setDegrees(newDegrees);
        onChange(newDegrees);
    };

    const removeDegree = (index) => {
        const newDegrees = degrees.filter((_, i) => i !== index);
        setDegrees(newDegrees);
        onChange(newDegrees);
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
            <h4 style={{ margin: '24px 0 12px 0', fontSize: '16px', color: theme.colors.text }}>Education</h4>
            {degrees.map((degree, index) => (
                <div key={index} style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.text }}>Degree {index + 1}</span>
                        {degrees.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeDegree(index)}
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

                    <label style={labelStyle}>Institution</label>
                    <input
                        type="text"
                        value={degree.institution}
                        onChange={(e) => handleDegreeChange(index, 'institution', e.target.value)}
                        placeholder="IIT Bombay"
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Degree</label>
                    <input
                        type="text"
                        value={degree.degree}
                        onChange={(e) => handleDegreeChange(index, 'degree', e.target.value)}
                        placeholder="B.Tech, M.Tech, MBA"
                        style={inputStyle}
                    />

                    <label style={labelStyle}>Field of Study</label>
                    <input
                        type="text"
                        value={degree.fieldOfStudy}
                        onChange={(e) => handleDegreeChange(index, 'fieldOfStudy', e.target.value)}
                        placeholder="Computer Science"
                        style={inputStyle}
                    />

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Start Year</label>
                            <input
                                type="number"
                                value={degree.startYear}
                                onChange={(e) => handleDegreeChange(index, 'startYear', e.target.value)}
                                placeholder="2015"
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>End Year</label>
                            <input
                                type="number"
                                value={degree.endYear}
                                onChange={(e) => handleDegreeChange(index, 'endYear', e.target.value)}
                                placeholder="2019"
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <label style={labelStyle}>Grade/CGPA (optional)</label>
                    <input
                        type="text"
                        value={degree.grade}
                        onChange={(e) => handleDegreeChange(index, 'grade', e.target.value)}
                        placeholder="8.5/10 or First Class"
                        style={inputStyle}
                    />
                </div>
            ))}

            <button
                type="button"
                onClick={addDegree}
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
                    marginBottom: '20px',
                }}
            >
                + Add Another Degree
            </button>
        </div>
    );
};

export default EducationForm;