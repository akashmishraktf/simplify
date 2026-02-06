import React, { useEffect, useState } from 'react';
import { theme } from '../utils/theme';

declare const chrome: any;

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
        color: theme.colors.textSecondary,
        marginBottom: 8,
        display: 'block',
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 14px',
        borderRadius: theme.borderRadius.md,
        border: `1px solid ${theme.colors.border}`,
        fontSize: '14px',
        fontFamily: theme.fonts.mono,
        background: theme.colors.inputBg,
        boxSizing: 'border-box',
        color: theme.colors.text,
        marginBottom: '12px',
        outline: 'none',
    };

    const buttonStyle: React.CSSProperties = {
        padding: '10px 16px',
        borderRadius: theme.borderRadius.md,
        background: theme.colors.text,
        color: theme.colors.bg,
        border: 'none',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    };

    const secondaryButtonStyle: React.CSSProperties = {
        padding: '10px 16px',
        borderRadius: theme.borderRadius.md,
        background: 'transparent',
        color: theme.colors.danger,
        border: `1px solid ${theme.colors.danger}`,
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{
                background: theme.colors.bgSecondary,
                borderRadius: theme.borderRadius.lg,
                border: `1px solid ${theme.colors.border}`,
                padding: '24px',
                marginBottom: '20px'
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 18, color: theme.colors.text }}>AI Model Configuration</h3>
                
                <div style={{ marginBottom: '24px' }}>
                    <label style={labelStyle}>Gemini API Key</label>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
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
                            onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                            onBlur={(e) => e.target.style.borderColor = theme.colors.border}
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
                                color: theme.colors.textSecondary,
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
                            style={{ fontSize: 13, color: theme.colors.primary, textDecoration: 'none', marginLeft: 'auto', fontWeight: 500 }}
                        >
                            Get API Key →
                        </a>
                    </div>
                </div>

                <div style={{
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: theme.borderRadius.md,
                    border: `1px solid ${theme.colors.info}40`,
                    color: theme.colors.info,
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