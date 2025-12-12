import React, { useState } from 'react';
import { updateProfile } from '../utils/api';
import EmploymentForm from './EmploymentForm';
import EducationForm from './EducationForm';

declare const chrome: any;

const defaultEnabledFields = {
    firstName: true,
    lastName: true,
    fullName: true,
    phoneNumber: true,
    address: true,
    currentLocation: true,
    preferredLocation: true,
    currentCompany: true,
    company: true,
    jobTitle: true,
    noticePeriod: true,
    currentCtc: true,
    expectedCtc: true,
    desiredSalary: true,
    linkedinUrl: true,
    portfolioUrl: true,
    githubUrl: true,
    coverLetter: true,
    workHistory: true,
    skills: true,
    experience: true,
    education: true,
    institution: true,
    location: true,
};

const ProfileForm = ({ profile, onUpdate }) => {
    const [formData, setFormData] = useState({
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        fullName: profile?.fullName || '',
        phoneNumber: profile?.phoneNumber || '',
        address: profile?.address || '',
        currentLocation: profile?.currentLocation || '',
        preferredLocation: profile?.preferredLocation || '',
        currentCompany: profile?.currentCompany || '',
        noticePeriodDays: profile?.noticePeriodDays || '',
        currentCtc: profile?.currentCtc || '',
        expectedCtc: profile?.expectedCtc || '',
        desiredSalary: profile?.desiredSalary || '',
        linkedinUrl: profile?.linkedinUrl || '',
        portfolioUrl: profile?.portfolioUrl || '',
        githubUrl: profile?.githubUrl || '',
        coverLetter: profile?.coverLetter || '',
        workHistory: profile?.workHistory || '',
        skills: profile?.skills?.join(', ') || '',
        // Demographic fields
        gender: profile?.gender || '',
        dateOfBirth: profile?.dateOfBirth || '',
        nationality: profile?.nationality || '',
        citizenship: profile?.citizenship || '',
        workAuthorization: profile?.workAuthorization || '',
        requiresSponsorship: profile?.requiresSponsorship || false,
        visaStatus: profile?.visaStatus || '',
        ethnicity: profile?.ethnicity || '',
        race: profile?.race || '',
        veteranStatus: profile?.veteranStatus || '',
        disabilityStatus: profile?.disabilityStatus || '',
        // Availability
        availabilityDate: profile?.availabilityDate || '',
        willingToRelocate: profile?.willingToRelocate || false,
        willingToTravel: profile?.willingToTravel || false,
        travelPercentage: profile?.travelPercentage || '',
        workPreference: profile?.workPreference || '',
    });
    const [showDemographics, setShowDemographics] = useState(false);
    const [employmentHistory, setEmploymentHistory] = useState(profile?.employmentHistory || []);
    const [education, setEducation] = useState(profile?.education || []);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [autofillOptions, setAutofillOptions] = useState({
        dryRun: false,
        enabledFields: defaultEnabledFields,
    });
    const toggleFields = [
        { key: 'firstName', label: 'First name' },
        { key: 'lastName', label: 'Last name' },
        { key: 'fullName', label: 'Full name' },
        { key: 'phoneNumber', label: 'Phone' },
        { key: 'address', label: 'Address' },
        { key: 'currentLocation', label: 'Current location' },
        { key: 'preferredLocation', label: 'Preferred location' },
        { key: 'location', label: 'Location (generic)' },
        { key: 'currentCompany', label: 'Current company' },
        { key: 'company', label: 'Company (any)' },
        { key: 'jobTitle', label: 'Job title' },
        { key: 'noticePeriod', label: 'Notice period' },
        { key: 'currentCtc', label: 'Current CTC' },
        { key: 'expectedCtc', label: 'Expected CTC' },
        { key: 'desiredSalary', label: 'Desired salary' },
        { key: 'linkedinUrl', label: 'LinkedIn' },
        { key: 'portfolioUrl', label: 'Portfolio' },
        { key: 'githubUrl', label: 'GitHub' },
        { key: 'coverLetter', label: 'Cover letter' },
        { key: 'workHistory', label: 'Work history' },
        { key: 'skills', label: 'Skills' },
        { key: 'experience', label: 'Experience' },
        { key: 'education', label: 'Education' },
        { key: 'institution', label: 'Institution' },
    ];

    React.useEffect(() => {
        setFormData({
            firstName: profile?.firstName || '',
            lastName: profile?.lastName || '',
            fullName: profile?.fullName || '',
            phoneNumber: profile?.phoneNumber || '',
            address: profile?.address || '',
            currentLocation: profile?.currentLocation || '',
            preferredLocation: profile?.preferredLocation || '',
            currentCompany: profile?.currentCompany || '',
            noticePeriodDays: profile?.noticePeriodDays || '',
            currentCtc: profile?.currentCtc || '',
            expectedCtc: profile?.expectedCtc || '',
            desiredSalary: profile?.desiredSalary || '',
            linkedinUrl: profile?.linkedinUrl || '',
            portfolioUrl: profile?.portfolioUrl || '',
            githubUrl: profile?.githubUrl || '',
            coverLetter: profile?.coverLetter || '',
            workHistory: profile?.workHistory || '',
            skills: profile?.skills?.join(', ') || '',
            // Demographic fields
            gender: profile?.gender || '',
            dateOfBirth: profile?.dateOfBirth || '',
            nationality: profile?.nationality || '',
            citizenship: profile?.citizenship || '',
            workAuthorization: profile?.workAuthorization || '',
            requiresSponsorship: profile?.requiresSponsorship || false,
            visaStatus: profile?.visaStatus || '',
            ethnicity: profile?.ethnicity || '',
            race: profile?.race || '',
            veteranStatus: profile?.veteranStatus || '',
            disabilityStatus: profile?.disabilityStatus || '',
            // Availability
            availabilityDate: profile?.availabilityDate || '',
            willingToRelocate: profile?.willingToRelocate || false,
            willingToTravel: profile?.willingToTravel || false,
            travelPercentage: profile?.travelPercentage || '',
            workPreference: profile?.workPreference || '',
        });
        setEmploymentHistory(profile?.employmentHistory || []);
        setEducation(profile?.education || []);
    }, [profile]);

    React.useEffect(() => {
        chrome.storage.local.get(['autofillOptions'], (result) => {
            const stored = result.autofillOptions || {};
            setAutofillOptions({
                dryRun: stored.dryRun ?? false,
                enabledFields: { ...defaultEnabledFields, ...(stored.enabledFields || {}) },
            });
        });
    }, []);

    const persistAutofillOptions = (nextOptions) => {
        setAutofillOptions(nextOptions);
        chrome.storage.local.set({ autofillOptions: nextOptions });
    };

    const handleToggleField = (fieldKey) => {
        const nextOptions = {
            ...autofillOptions,
            enabledFields: {
                ...autofillOptions.enabledFields,
                [fieldKey]: !autofillOptions.enabledFields[fieldKey],
            },
        };
        persistAutofillOptions(nextOptions);
    };

    const handleDryRunToggle = () => {
        persistAutofillOptions({
            ...autofillOptions,
            dryRun: !autofillOptions.dryRun,
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const derivedFullName = formData.fullName || [formData.firstName, formData.lastName].filter(Boolean).join(' ').trim();
            const profileData = {
                ...formData,
                fullName: derivedFullName || null,
                noticePeriodDays: formData.noticePeriodDays ? parseInt(formData.noticePeriodDays as string) : null,
                skills: formData.skills ? (formData.skills as string).split(',').map(s => s.trim()).filter(Boolean) : [],
                employmentHistory,
                education,
                // Ensure booleans are properly typed
                requiresSponsorship: formData.requiresSponsorship || false,
                willingToRelocate: formData.willingToRelocate || false,
                willingToTravel: formData.willingToTravel || false,
            };

            await updateProfile(profileData);
            setMessage('Profile saved successfully!');
            if (onUpdate) onUpdate();
        } catch (err) {
            setMessage('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        marginBottom: '10px',
        boxSizing: 'border-box' as const,
        fontSize: '13px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold' as const,
        marginBottom: '5px',
        marginTop: '6px',
        color: '#0f172a',
    };

    return (
        <div style={{ padding: '8px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#0f172a' }}>Your profile</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#475569' }}>
                    Keep this in sync—autofill pulls directly from here.
                </p>
            </div>
            <div style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: '4px' }}>
                <form onSubmit={handleSubmit}>
                <label style={labelStyle}>First Name</label>
                <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="John"
                    style={inputStyle}
                />

                <label style={labelStyle}>Last Name</label>
                <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Doe"
                    style={inputStyle}
                />

                <label style={labelStyle}>Full Name (optional)</label>
                <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Johnathan Doe"
                    style={inputStyle}
                />

                <label style={labelStyle}>Phone Number</label>
                <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+91 9876543210"
                    style={inputStyle}
                />

                <label style={labelStyle}>Address</label>
                <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House/Street, Area, City, State"
                    rows={2}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                />

                <label style={labelStyle}>Current Location</label>
                <input
                    type="text"
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleChange}
                    placeholder="Bangalore, Karnataka"
                    style={inputStyle}
                />

                <label style={labelStyle}>Preferred Location</label>
                <input
                    type="text"
                    name="preferredLocation"
                    value={formData.preferredLocation}
                    onChange={handleChange}
                    placeholder="Bangalore, Hyderabad, Remote"
                    style={inputStyle}
                />

                <label style={labelStyle}>Current Company</label>
                <input
                    type="text"
                    name="currentCompany"
                    value={formData.currentCompany}
                    onChange={handleChange}
                    placeholder="Current employer"
                    style={inputStyle}
                />

                <label style={labelStyle}>Notice Period (days)</label>
                <input
                    type="number"
                    name="noticePeriodDays"
                    value={formData.noticePeriodDays}
                    onChange={handleChange}
                    placeholder="30"
                    style={inputStyle}
                />

                <label style={labelStyle}>Current CTC (₹/year)</label>
                <input
                    type="text"
                    name="currentCtc"
                    value={formData.currentCtc}
                    onChange={handleChange}
                    placeholder="8,00,000"
                    style={inputStyle}
                />

                <label style={labelStyle}>Expected CTC (₹/year)</label>
                <input
                    type="text"
                    name="expectedCtc"
                    value={formData.expectedCtc}
                    onChange={handleChange}
                    placeholder="12,00,000"
                    style={inputStyle}
                />

                <label style={labelStyle}>Desired Salary (optional)</label>
                <input
                    type="text"
                    name="desiredSalary"
                    value={formData.desiredSalary}
                    onChange={handleChange}
                    placeholder="₹15,00,000 / $100k / 60 LPA"
                    style={inputStyle}
                />

                <label style={labelStyle}>Skills (comma-separated)</label>
                <textarea
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="React, Node.js, Python, SQL"
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                />

                <label style={labelStyle}>LinkedIn URL</label>
                <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    placeholder="https://www.linkedin.com/in/username"
                    style={inputStyle}
                />

                <label style={labelStyle}>Portfolio URL</label>
                <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://your-portfolio.com"
                    style={inputStyle}
                />

                <label style={labelStyle}>GitHub URL</label>
                <input
                    type="url"
                    name="githubUrl"
                    value={formData.githubUrl}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    style={inputStyle}
                />

                <label style={labelStyle}>Cover Letter (snippet)</label>
                <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    placeholder="Short summary you reuse in applications"
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                />

                <label style={labelStyle}>Work History Summary</label>
                <textarea
                    name="workHistory"
                    value={formData.workHistory}
                    onChange={handleChange}
                    placeholder="1-2 paragraph overview for text areas"
                    rows={4}
                    style={{ ...inputStyle, resize: 'vertical' as const }}
                />

                {/* Demographic & Legal Fields - Collapsible */}
                <div style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#fafafa',
                }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => setShowDemographics(!showDemographics)}
                    >
                        <h4 style={{ margin: 0, fontSize: '13px' }}>📋 Demographic & Legal Info</h4>
                        <span style={{ fontSize: '12px' }}>{showDemographics ? '▼' : '▶'}</span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#666' }}>
                        Optional fields for EEOC compliance. AI will use smart defaults if empty.
                    </p>

                    {showDemographics && (
                        <div style={{ marginTop: '10px' }}>
                            <label style={labelStyle}>Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified (AI will use "Prefer not to say")</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Non-binary">Non-binary</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>

                            <label style={labelStyle}>Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                style={inputStyle}
                            />

                            <label style={labelStyle}>Nationality</label>
                            <input
                                type="text"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleChange}
                                placeholder="Indian"
                                style={inputStyle}
                            />

                            <label style={labelStyle}>Work Authorization</label>
                            <select name="workAuthorization" value={formData.workAuthorization} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified</option>
                                <option value="Citizen">Citizen</option>
                                <option value="Permanent Resident">Permanent Resident</option>
                                <option value="Work Visa">Work Visa (H1B, L1, etc.)</option>
                                <option value="Student Visa">Student Visa (OPT/CPT)</option>
                                <option value="Other">Other</option>
                            </select>

                            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    name="requiresSponsorship"
                                    checked={formData.requiresSponsorship}
                                    onChange={handleChange}
                                />
                                Requires Visa Sponsorship
                            </label>

                            <label style={labelStyle}>Ethnicity (US EEOC)</label>
                            <select name="ethnicity" value={formData.ethnicity} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified (AI uses "Decline")</option>
                                <option value="Hispanic or Latino">Hispanic or Latino</option>
                                <option value="Not Hispanic or Latino">Not Hispanic or Latino</option>
                                <option value="Decline to self-identify">Decline to self-identify</option>
                            </select>

                            <label style={labelStyle}>Race (US EEOC)</label>
                            <select name="race" value={formData.race} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified (AI uses "Decline")</option>
                                <option value="Asian">Asian</option>
                                <option value="Black or African American">Black or African American</option>
                                <option value="White">White</option>
                                <option value="Native American">Native American / Alaska Native</option>
                                <option value="Pacific Islander">Native Hawaiian / Pacific Islander</option>
                                <option value="Two or more races">Two or more races</option>
                                <option value="Decline to self-identify">Decline to self-identify</option>
                            </select>

                            <label style={labelStyle}>Veteran Status</label>
                            <select name="veteranStatus" value={formData.veteranStatus} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified</option>
                                <option value="I am not a veteran">I am not a veteran</option>
                                <option value="I am a veteran">I am a veteran</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>

                            <label style={labelStyle}>Disability Status</label>
                            <select name="disabilityStatus" value={formData.disabilityStatus} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified</option>
                                <option value="No">No, I don't have a disability</option>
                                <option value="Yes">Yes, I have a disability</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                            </select>

                            <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #ddd' }} />

                            <label style={labelStyle}>Availability / Start Date</label>
                            <input
                                type="text"
                                name="availabilityDate"
                                value={formData.availabilityDate}
                                onChange={handleChange}
                                placeholder="Immediately, 2 weeks, After notice period"
                                style={inputStyle}
                            />

                            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    name="willingToRelocate"
                                    checked={formData.willingToRelocate}
                                    onChange={handleChange}
                                />
                                Willing to Relocate
                            </label>

                            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    name="willingToTravel"
                                    checked={formData.willingToTravel}
                                    onChange={handleChange}
                                />
                                Willing to Travel
                            </label>

                            <label style={labelStyle}>Travel Percentage</label>
                            <select name="travelPercentage" value={formData.travelPercentage} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified</option>
                                <option value="0%">0% (No travel)</option>
                                <option value="Up to 25%">Up to 25%</option>
                                <option value="Up to 50%">Up to 50%</option>
                                <option value="Up to 75%">Up to 75%</option>
                                <option value="Up to 100%">Up to 100%</option>
                            </select>

                            <label style={labelStyle}>Work Preference</label>
                            <select name="workPreference" value={formData.workPreference} onChange={handleChange} style={inputStyle}>
                                <option value="">Not specified (AI uses "Flexible")</option>
                                <option value="Remote">Remote</option>
                                <option value="Hybrid">Hybrid</option>
                                <option value="On-site">On-site</option>
                                <option value="Flexible">Flexible / No preference</option>
                            </select>
                        </div>
                    )}
                </div>

                <div style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    borderRadius: '4px',
                    marginTop: '10px',
                    marginBottom: '10px',
                    backgroundColor: '#f6f7fb',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0, fontSize: '13px' }}>Autofill settings</h4>
                        <label style={{ display: 'flex', alignItems: 'center', fontSize: '11px', gap: '6px' }}>
                            <input
                                type="checkbox"
                                checked={autofillOptions.dryRun}
                                onChange={handleDryRunToggle}
                                style={{ margin: 0 }}
                            />
                            Dry run (highlight only)
                        </label>
                    </div>
                    <p style={{ margin: '6px 0 8px 0', fontSize: '10px', color: '#555' }}>
                        Choose which fields to prefill. Disable any that often conflict; dry run highlights fields without writing values.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 10px' }}>
                        {toggleFields.map(({ key, label }) => (
                            <label key={key} style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                    type="checkbox"
                                    checked={autofillOptions.enabledFields[key]}
                                    onChange={() => handleToggleField(key)}
                                    style={{ margin: 0 }}
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                <EmploymentForm employment={employmentHistory} onChange={setEmploymentHistory} />
                <EducationForm education={education} onChange={setEducation} />

                <button
                    type="submit"
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '12px',
                        marginTop: '10px',
                        background: saving ? '#cbd5e1' : 'linear-gradient(135deg, #4f46e5, #6366f1)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontSize: '14px',
                        boxShadow: saving ? 'none' : '0 10px 24px rgba(79,70,229,0.25)',
                    }}
                >
                    {saving ? 'Saving...' : 'Save Profile'}
                </button>
            </form>

            {message && (
                <p style={{
                    marginTop: '10px',
                    fontSize: '11px',
                    color: message.includes('success') ? 'green' : 'red',
                    textAlign: 'center',
                }}>
                    {message}
                </p>
            )}
            </div>
        </div>
    );
};

export default ProfileForm;
