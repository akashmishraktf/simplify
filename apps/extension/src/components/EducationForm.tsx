import React, { useState } from 'react';

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
            <h4 style={{ margin: '10px 0 5px 0', fontSize: '13px' }}>Education</h4>
            {degrees.map((degree, index) => (
                <div key={index} style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    marginBottom: '10px',
                    borderRadius: '4px',
                    backgroundColor: '#f9f9f9',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Degree {index + 1}</span>
                        {degrees.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeDegree(index)}
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

                    <div style={{ display: 'flex', gap: '10px' }}>
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
                + Add Another Degree
            </button>
        </div>
    );
};

export default EducationForm;
