import { mapFormFields, fillField, calculateTotalExperience, getAllFillableElements, getComputedLabel, detectFieldType, FormField } from './utils/fieldMapper';

console.log('[Simplify-for-India] Content script loaded');

type AutofillOptions = {
    dryRun: boolean;
    enabledFields: Record<string, boolean>;
};

const DEFAULT_ENABLED_FIELDS: Record<string, boolean> = {
    firstName: true,
    lastName: true,
    fullName: true,
    email: true,
    phoneNumber: true,
    address: true,
    currentLocation: true,
    preferredLocation: true,
    location: true,
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
    experience: true,
    skills: true,
    education: true,
    institution: true,
};

let currentProfile: any = null;
let autofillButtons: HTMLElement[] = [];
let autofillOptions: AutofillOptions = {
    dryRun: false,
    enabledFields: { ...DEFAULT_ENABLED_FIELDS },
};

// Fetch user profile from storage
async function loadProfile() {
    try {
        const result = await chrome.storage.local.get(['access_token']);
        if (!result.access_token) {
            console.log('[Simplify-for-India] No access token found');
            return null;
        }

        const response = await fetch('http://localhost:3000/v1/profile', {
            headers: {
                'Authorization': `Bearer ${result.access_token}`,
            },
        });

        if (response.ok) {
            currentProfile = await response.json();
            console.log('[Simplify-for-India] Profile loaded:', currentProfile);
            return currentProfile;
        }
    } catch (err) {
        console.error('[Simplify-for-India] Failed to load profile:', err);
    }
    return null;
}

async function loadAutofillOptions(): Promise<AutofillOptions> {
    try {
        const stored = await chrome.storage.local.get(['autofillOptions']);
        const options = stored.autofillOptions || {};
        autofillOptions = {
            dryRun: options.dryRun ?? false,
            enabledFields: { ...DEFAULT_ENABLED_FIELDS, ...(options.enabledFields || {}) },
        };
    } catch (err) {
        console.error('[Simplify-for-India] Failed to load autofill options:', err);
        autofillOptions = {
            dryRun: false,
            enabledFields: { ...DEFAULT_ENABLED_FIELDS },
        };
    }
    return autofillOptions;
}

function clearPreviewHighlights() {
    const highlighted = document.querySelectorAll('[data-simplify-preview="1"]');
    highlighted.forEach((el: any) => {
        el.style.outline = '';
        el.style.backgroundColor = '';
        el.removeAttribute('data-simplify-preview');
    });
}

function highlightField(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: any) {
    element.setAttribute('data-simplify-preview', '1');
    element.style.outline = '2px dashed #667eea';
    element.style.backgroundColor = '#f0f4ff';
    element.title = `Would fill: ${String(value).slice(0, 140)}`;
}

function createAutofillButton(form: HTMLFormElement | HTMLElement): HTMLElement {
    const button = document.createElement('div');
    button.className = 'simplify-india-autofill-btn';
    button.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: transform 0.2s, box-shadow 0.2s;
        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.3)'">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
            </svg>
            <span>Autofill with Simplify</span>
        </div>
    `;

    button.addEventListener('click', () => {
        autofillForm(form);
    });

    return button;
}

// Prepare metadata for the backend agent using the advanced FieldMapper
function getFormFieldsMetadata(form: HTMLFormElement | HTMLElement): any[] {
    const fields: any[] = [];
    const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
    
    // Process radio/checkbox groups
    const processedRadioGroups = new Set<string>();
    
    let fieldCounter = 0;

    elements.forEach((element) => {
        // Advanced Label Detection
        const label = getComputedLabel(element);
        
        // Surrounding context
        let surroundingText = '';
        const parent = element.closest('div, td, li, fieldset, section');
        if (parent) {
            const text = parent.textContent || '';
            if (text.length < 300) surroundingText = text.replace(label, '').trim();
        }

        // Section Title
        let sectionTitle = '';
        const section = element.closest('fieldset, section, [class*="section"], [class*="group"]');
        if (section) {
            const header = section.querySelector('legend, h1, h2, h3, h4');
            if (header) sectionTitle = header.textContent?.trim() || '';
        }

        // --- Group Logic (Radio/Checkbox) ---
        if (element.type === 'radio' && element.name) {
            const groupName = element.name;
            if (processedRadioGroups.has(groupName)) return;
            processedRadioGroups.add(groupName);

            // Find all radios in this group (scope might be larger than current shadow root if not careful, but usually within same form)
            // Use querySelectorAll on the common ancestor or form
            const root = form.shadowRoot || form;
            const radios = Array.from(root.querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`));
            
            const options = radios.map((r: any) => ({
                value: r.value,
                text: getComputedLabel(r) || r.value,
                selected: r.checked
            }));

            fields.push({
                field_id: `field_${fieldCounter}`,
                element_type: 'radio',
                input_type: 'radio',
                name: groupName,
                id: element.id || '',
                label: label || sectionTitle || groupName,
                options,
                group_name: groupName,
                surrounding_text: surroundingText,
                section_title: sectionTitle
            });
            fieldCounter++;
            return;
        }

        // Select Options
        let options: any[] | undefined;
        if (element instanceof HTMLSelectElement) {
            options = Array.from(element.options)
                .filter(o => o.value)
                .map(o => ({ value: o.value, text: o.text.trim(), selected: o.selected }));
        }

        fields.push({
            field_id: `field_${fieldCounter}`,
            element_type: element.tagName.toLowerCase() === 'select' ? 'select' : element.tagName.toLowerCase() === 'textarea' ? 'textarea' : 'input',
            input_type: element.type || '',
            name: element.name || '',
            id: element.id || '',
            placeholder: element.placeholder || '',
            label,
            aria_label: element.getAttribute('aria-label') || '',
            required: element.required || false,
            options,
            current_value: element.value || '',
            surrounding_text: surroundingText,
            section_title: sectionTitle
        });
        fieldCounter++;
    });

    return fields;
}

async function autofillForm(form: HTMLFormElement | HTMLElement) {
    if (!currentProfile) {
        await loadProfile();
    }
    await loadAutofillOptions();
    clearPreviewHighlights();

    if (!currentProfile) {
        alert('Please log in to Simplify for India extension first!');
        return;
    }

    const fieldsMetadata = getFormFieldsMetadata(form);
    
    if (fieldsMetadata.length === 0) {
        showNotification('No fillable fields found', 'info');
        return;
    }

    showNotification('🤖 AI Agent analyzing form...', 'info');

    try {
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

        // Execution Phase
        // We need to re-find elements because the metadata array index corresponds to the flat list from getAllFillableElements
        const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
        let filledCount = 0;

        for (const res of results) {
            if (res.action === 'skip') continue;

            const idx = parseInt(res.field_id.replace('field_', ''));
            const element = elements[idx];

            if (element) {
                if (autofillOptions.dryRun) {
                    highlightField(element, res.value);
                    filledCount++;
                } else {
                    fillField(element, res.value);
                    filledCount++;
                }
            }
        }

        if (autofillOptions.dryRun) {
            showNotification(`Previewed ${filledCount} fields`, 'info');
        } else {
            showNotification(`✓ Filled ${filledCount} fields!`, 'success');
            if (filledCount > 0) trackApplication(form);
        }

    } catch (error) {
        console.error('[Simplify-for-India] Autofill failed:', error);
        showNotification('❌ Autofill failed', 'error');
    }
}

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

async function trackApplication(form: HTMLFormElement | HTMLElement) {
    try {
        const result = await chrome.storage.local.get(['access_token']);
        if (!result.access_token) return;
        
        await fetch('http://localhost:3000/v1/applications', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${result.access_token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: window.location.href,
                company: document.title,
                dateApplied: new Date().toISOString()
            }),
        });
    } catch (e) { /* silent fail */ }
}

function scoreForm(form: HTMLElement | HTMLFormElement): number {
    const inputs = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
    if (inputs.length < 3) return -10;

    let score = inputs.length * 2;
    
    // Check for keywords in the form text
    const text = (form.textContent || '').toLowerCase();
    if (text.includes('apply') || text.includes('application')) score += 20;
    if (text.includes('resume') || text.includes('cv')) score += 30;
    if (text.includes('search') || text.includes('find job')) score -= 20; // De-prioritize search bars
    if (text.includes('login') || text.includes('sign in')) score -= 20;

    return score;
}

function detectForms() {
    // 1. Check <form> tags
    const forms = Array.from(document.querySelectorAll('form'));
    
    // 2. Check "Virtual Forms" (divs that act as forms)
    const virtualSelectors = [
        '[class*="application"]', '[id*="application"]', 
        '[class*="apply"]', '[id*="apply"]', 
        '.job-form', '[role="form"]', '[class*="greenhouse"]', '[class*="lever"]'
    ];
    const virtualForms = Array.from(document.querySelectorAll(virtualSelectors.join(','))) as HTMLElement[];

    const allCandidates = [...forms, ...virtualForms];
    let bestForm: HTMLElement | null = null;
    let maxScore = 0;

    allCandidates.forEach(f => {
        // Dedup: if this element is inside another candidate, ignore it (unless it's much better?)
        // Actually, usually we want the *outermost* container that is still specific.
        // For simplicity, just score them all.
        const s = scoreForm(f);
        if (s > maxScore) {
            maxScore = s;
            bestForm = f;
        }
    });

    // Remove old buttons
    autofillButtons.forEach(b => b.remove());
    autofillButtons = [];

    if (bestForm && maxScore > 10) {
        console.log(`[Simplify-for-India] Best form found:`, bestForm, `Score: ${maxScore}`);
        const btn = createAutofillButton(bestForm);
        document.body.appendChild(btn);
        autofillButtons.push(btn);
    }
}

// Throttled detection
let timer: any;
function onDomChange() {
    clearTimeout(timer);
    timer = setTimeout(detectForms, 1000);
}

// Initial load
loadProfile();
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', detectForms);
} else {
    detectForms();
}
// Periodic check (for SPAs)
const observer = new MutationObserver(onDomChange);
observer.observe(document.body, { childList: true, subtree: true });
setInterval(detectForms, 3000); // Backup check every 3s