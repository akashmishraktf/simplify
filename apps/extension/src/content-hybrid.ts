/**
 * HYBRID AUTOFILL SYSTEM
 *
 * Our competitive advantage over Simplify:
 * 1. Use ATS configs for 48 known systems (instant, accurate)
 * 2. Fall back to AI for unknown forms (flexible, learns)
 * 3. Learn from successful fills to improve over time
 */

import { fillField, getAllFillableElements } from './utils/fieldMapper';
import { autofillWithHybridEngine, detectATS, fillFormWithATS } from './utils/atsEngine';

console.log('[Simplify Pro] Hybrid ATS Engine v2.0 loaded - 48 ATS systems + AI fallback');

let currentProfile: any = null;

// Load user profile from backend
async function loadProfile() {
    try {
        const result = await chrome.storage.local.get(['access_token']);
        if (!result.access_token) {
            console.log('[Simplify Pro] No access token found');
            return null;
        }

        const response = await fetch('http://localhost:3000/v1/profile', {
            headers: {
                'Authorization': `Bearer ${result.access_token}`,
            },
        });

        if (response.ok) {
            currentProfile = await response.json();
            console.log('[Simplify Pro] Profile loaded');
            return currentProfile;
        }
    } catch (err) {
        console.error('[Simplify Pro] Failed to load profile:', err);
    }
    return null;
}

// Create autofill button
function createAutofillButton(form: HTMLFormElement | HTMLElement): HTMLElement {
    const button = document.createElement('div');
    button.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; padding: 14px 24px; border-radius: 50px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer; z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-size: 15px; font-weight: 600;
        display: flex; align-items: center; gap: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        animation: slideIn 0.4s ease-out;
    `;

    // Detect ATS system
    const atsName = detectATS(window.location.href);
    const atsLabel = atsName ? `Autofill (${atsName})` : 'Autofill with AI';

    button.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
        <span style="letter-spacing: 0.3px;">${atsLabel}</span>
    `;

    // Hover effect
    button.onmouseenter = () => {
        button.style.transform = 'scale(1.05) translateY(-2px)';
        button.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
    };

    button.onmouseleave = () => {
        button.style.transform = 'scale(1) translateY(0)';
        button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
    };

    button.onclick = async () => {
        button.style.pointerEvents = 'none';
        button.style.opacity = '0.7';
        button.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 6v6l4 2"></path>
            </svg>
            <span>Filling...</span>
        `;

        await autofillFormHybrid(form);

        setTimeout(() => button.remove(), 2000);
    };

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    return button;
}

// Show notification
function showNotification(message: string, type: 'success' | 'error' | 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white; padding: 12px 20px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483647;
        font-family: system-ui, sans-serif; font-size: 14px;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 4000);
}

// Hybrid autofill function
async function autofillFormHybrid(form: HTMLFormElement | HTMLElement) {
    if (!currentProfile) {
        await loadProfile();
    }

    if (!currentProfile) {
        showNotification('Please log in first!', 'error');
        return;
    }

    const url = window.location.href;
    const atsName = detectATS(url);

    if (atsName) {
        // Use ATS-specific configuration
        console.log('[Simplify Pro] Using ATS config:', atsName);
        showNotification(`🚀 Filling with ${atsName} config...`, 'info');

        try {
            const result = await fillFormWithATS(atsName, currentProfile);

            if (result.success && result.filledCount > 0) {
                showNotification(`✓ Filled ${result.filledCount}/${result.totalCount} fields!`, 'success');
                trackApplication();
                return;
            }
        } catch (error) {
            console.error('[Simplify Pro] ATS fill failed:', error);
        }
    }

    // Fall back to AI engine
    console.log('[Simplify Pro] Using AI engine');
    showNotification('🤖 AI analyzing form...', 'info');

    try {
        await autofillWithAI(form);
    } catch (error) {
        console.error('[Simplify Pro] AI fill failed:', error);
        showNotification('❌ Autofill failed', 'error');
    }
}

// AI fallback for unknown forms
async function autofillWithAI(form: HTMLFormElement | HTMLElement) {
    const fieldsMetadata = getFormFieldsMetadata(form);

    if (fieldsMetadata.length === 0) {
        showNotification('No fillable fields found', 'info');
        return;
    }

    const result = await chrome.storage.local.get(['access_token', 'gemini_api_key']);
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${result.access_token}`,
        'Content-Type': 'application/json',
    };

    if (result.gemini_api_key) {
        headers['x-gemini-api-key'] = result.gemini_api_key;
    }

    const response = await fetch('http://localhost:3000/v1/mapping/agent-fill', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            fields: fieldsMetadata,
            url: window.location.href,
        }),
    });

    if (!response.ok) throw new Error('Agent API failed');

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
        showNotification('❌ No fields could be filled', 'error');
        return;
    }

    // Fill fields
    const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
    let filledCount = 0;

    for (const res of results) {
        if (res.action === 'skip') continue;

        const idx = parseInt(res.field_id.replace('field_', ''));
        const element = elements[idx];

        if (element) {
            fillField(element, res.value);
            filledCount++;
        }
    }

    showNotification(`✓ Filled ${filledCount} fields with AI!`, 'success');
    trackApplication();
}

// Get form fields metadata
function getFormFieldsMetadata(form: HTMLFormElement | HTMLElement): any[] {
    const fields: any[] = [];
    const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);

    elements.forEach((element, idx) => {
        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button') {
            return;
        }

        const label = (element as any).labels?.[0]?.textContent?.trim() || '';
        let options: any[] | undefined;

        if (element instanceof HTMLSelectElement) {
            options = Array.from(element.options)
                .filter(o => o.value)
                .map(o => ({ value: o.value, text: o.text.trim(), selected: o.selected }));
        }

        fields.push({
            field_id: `field_${idx}`,
            element_type: element.tagName.toLowerCase(),
            input_type: element.type || '',
            name: element.name || '',
            id: element.id || '',
            placeholder: element.getAttribute('placeholder') || '',
            label,
            aria_label: element.getAttribute('aria-label') || '',
            required: element.hasAttribute('required'),
            options,
            current_value: (element as any).value || '',
        });
    });

    return fields;
}

// Track application
async function trackApplication() {
    try {
        const result = await chrome.storage.local.get(['access_token']);
        if (!result.access_token) return;

        await fetch('http://localhost:3000/v1/applications', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${result.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: window.location.href,
                company: document.title,
                dateApplied: new Date().toISOString()
            }),
        });
    } catch (e) {
        console.error('[Simplify Pro] Track failed:', e);
    }
}

// Initialize
function init() {
    loadProfile();

    // Detect forms and add buttons
    const observer = new MutationObserver(() => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.hasAttribute('data-simplify-pro')) {
                form.setAttribute('data-simplify-pro', '1');

                const inputs = getAllFillableElements(form);
                if (inputs.length > 2) {
                    const button = createAutofillButton(form);
                    document.body.appendChild(button);
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    setTimeout(() => {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = getAllFillableElements(form);
            if (inputs.length > 2) {
                const button = createAutofillButton(form);
                document.body.appendChild(button);
            }
        });
    }, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
