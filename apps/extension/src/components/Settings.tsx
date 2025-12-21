import React, { useEffect, useState } from 'react';

const Settings = () => {
    const [apiKey, setApiKey] = useState('');
    const [saved, setSaved] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        chrome.storage.local.get(['gemini_api_key'], (result) => {
            if (result.gemini_api_key) {
                setApiKey(result.gemini_api_key);
            }
        });
    }, []);

    const handleSave = () => {
        chrome.storage.local.set({ gemini_api_key: apiKey }, () => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    const handleClear = () => {
        chrome.storage.local.remove(['gemini_api_key'], () => {
            setApiKey('');
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        });
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 13,
        fontWeight: 600,
        color: '#0f172a',
        marginBottom: 8,
        display: 'block',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 14px',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
        fontSize: '14px',
        fontFamily: 'monospace',
        background: '#f8fafc',
        boxSizing: 'border-box',
        color: '#334155',
        marginBottom: '12px',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 16px',
        borderRadius: '10px',
        background: '#0f172a',
        color: 'white',
        border: 'none',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    };

    const secondaryButtonStyle: React.CSSProperties = {
        padding: '10px 16px',
        borderRadius: '10px',
        background: 'transparent',
        color: '#ef4444',
        border: '1px solid #fca5a5',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    };

    return (
        <div style={{ padding: '4px' }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16, color: '#0f172a' }}>AI Model Configuration</h3>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={labelStyle}>Gemini API Key</label>
                    <p style={{ margin: '0 0 12px', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>
                        Provide your own Google Gemini API key to enable higher rate limits and ensure uninterrupted autofilling. 
                        Your key is stored locally in your browser and never shared.
                    </p>
                    
                    <div style={{ position: 'relative' }}>
                        <input
                            type={isVisible ? "text" : "password"}
                            placeholder="AIzaSy..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            style={inputStyle}
                        />
                        <button 
                            onClick={() => setIsVisible(!isVisible)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '12px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                color: '#64748b',
                                fontWeight: 600
                            }}
                        >
                            {isVisible ? 'Hide' : 'Show'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button onClick={handleSave} style={buttonStyle}>
                            {saved ? 'Saved ✓' : 'Save Key'}
                        </button>
                        {apiKey && (
                            <button onClick={handleClear} style={secondaryButtonStyle}>
                                Clear Key
                            </button>
                        )}
                        <a 
                            href="https://aistudio.google.com/app/apikey" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ fontSize: 13, color: '#4f46e5', textDecoration: 'none', marginLeft: 'auto', fontWeight: 500 }}
                        >
                            Get API Key →
                        </a>
                    </div>
                </div>

                <div style={{
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    border: '1px solid #bae6fd',
                    color: '#0369a1',
                    fontSize: 13,
                    lineHeight: 1.5
                }}>
                    <strong>Note:</strong> We recommend using the <strong>Gemini 2.5 Flash</strong> model which is currently free for reasonable usage limits.
                </div>
            </div>
        </div>
    );
};

export default Settings;
