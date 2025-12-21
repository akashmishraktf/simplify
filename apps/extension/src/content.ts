import {
    mapFormFields,
    fillField,
    calculateTotalExperience,
    getAllFillableElements,
    getComputedLabel,
    detectFieldType,
    FormField,
    generateFormSignature,
    getCachedMapping,
    saveCachedMapping,
    fillFormWithRules,
    getProfileValueForFieldType
} from './utils/fieldMapper';

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
    const container = document.createElement('div');
    container.className = 'simplify-india-autofill-btn';

    // Create main button
    const button = document.createElement('div');
    button.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 14px 24px;
        border-radius: 50px;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        cursor: pointer;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        font-size: 15px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;
        border: none;
        animation: slideIn 0.4s ease-out;
    `;

    button.innerHTML = `
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
        </svg>
        <span style="letter-spacing: 0.3px;">Autofill with Simplify</span>
    `;

    // Add keyframes for animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(100px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        @keyframes pulse {
            0%, 100% {
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
            }
            50% {
                box-shadow: 0 4px 30px rgba(102, 126, 234, 0.6);
            }
        }
    `;
    document.head.appendChild(style);

    // Hover effects
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-3px) scale(1.02)';
        button.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0) scale(1)';
        button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
    });

    // Click effect
    button.addEventListener('mousedown', () => {
        button.style.transform = 'translateY(-1px) scale(0.98)';
    });

    button.addEventListener('mouseup', () => {
        button.style.transform = 'translateY(-3px) scale(1.02)';
    });

    button.addEventListener('click', () => {
        // Add loading state
        button.innerHTML = `
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
            </svg>
            <span style="letter-spacing: 0.3px;">Processing...</span>
        `;

        // Add spin animation
        const spinStyle = document.createElement('style');
        spinStyle.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(spinStyle);

        autofillForm(form);
    });

    container.appendChild(button);
    return container;
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

    // ========================================================================
    // HYBRID AUTOFILL STRATEGY
    // 1. Check cache (instant)
    // 2. Try rule-based matching (fast, <100ms)
    // 3. Fill known fields immediately
    // 4. Use LLM for unknown fields (optional, async)
    // ========================================================================

    const formSignature = generateFormSignature(fieldsMetadata);
    const url = window.location.href;

    // Step 1: Try cache first
    const cachedMappings = await getCachedMapping(formSignature, url);
    let results: any[] = [];

    if (cachedMappings && cachedMappings.length > 0) {
        // Cache hit! Use cached mappings
        console.log('[Autofill] Using cached mappings');
        showNotification('⚡ Using cached mappings...', 'info');

        results = cachedMappings.map((mapping: any) => ({
            field_id: mapping.fieldId,
            action: 'fill',
            value: getProfileValueForFieldType(mapping.fieldType, currentProfile),
            confidence: mapping.confidence,
            reasoning: `Cached: ${mapping.fieldType}`,
            source: 'cache',
        }));
    } else {
        // Step 2: Use rule-based matching
        console.log('[Autofill] Using rule-based matching');
        showNotification('🔍 Smart autofill analyzing form...', 'info');

        results = fillFormWithRules(fieldsMetadata, currentProfile);
    }

    // Filter out fields that couldn't be filled by rules
    const filledResults = results.filter(r => r.action === 'fill');
    const unknownFields = results.filter(r => r.needsAI === true);

    // Step 3: Execute field filling immediately (for known fields)
    const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
    let filledCount = 0;
    let previewCount = 0;

    for (const res of filledResults) {
        if (res.action === 'skip' || !res.value) continue;

        const idx = parseInt(res.field_id.replace('field_', ''));
        const element = elements[idx];

        if (element) {
            if (autofillOptions.dryRun) {
                highlightField(element, res.value);
                previewCount++;
            } else {
                await fillField(element, res.value);
                filledCount++;

                // Show progress
                if (filledCount % 5 === 0) {
                    updateProgressNotification(filledCount, filledResults.length);
                }
            }
        }
    }

    // Show completion message
    if (autofillOptions.dryRun) {
        showNotification(`✓ Preview: ${previewCount} fields`, 'success');
    } else {
        showNotification(`✓ Filled ${filledCount} fields instantly!`, 'success');

        // Save to cache for next time (only if not from cache)
        if (!cachedMappings) {
            const mappingsToCache = results
                .filter(r => r.action === 'fill')
                .map(r => {
                    // Extract field type from reasoning
                    const fieldType = r.reasoning?.replace('Rule-based match: ', '') || 'unknown';
                    return {
                        fieldId: r.field_id,
                        fieldType: fieldType,
                        confidence: r.confidence || 0.9,
                    };
                });

            if (mappingsToCache.length > 0) {
                await saveCachedMapping(formSignature, url, mappingsToCache);
            }
        }

        if (filledCount > 0) trackApplication(form);
    }

    // Step 4: Optional AI enhancement for unknown fields (background)
    if (unknownFields.length > 0 && !autofillOptions.dryRun) {
        console.log(`[Autofill] ${unknownFields.length} unknown fields - considering AI enhancement`);
        // Show option to use AI
        showAIEnhancementOption(form, unknownFields, fieldsMetadata);
    }
}

// Progress notification
function updateProgressNotification(current: number, total: number) {
    const notification = document.querySelector('[data-simplify-progress]') as HTMLElement;
    if (notification) {
        notification.textContent = `Filling field ${current} of ${total}...`;
    } else {
        const notif = document.createElement('div');
        notif.setAttribute('data-simplify-progress', '1');
        notif.style.cssText = `
            position: fixed; top: 80px; right: 20px;
            background: #2196F3; color: white; padding: 12px 20px; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483647;
            font-family: system-ui, sans-serif; font-size: 14px;
        `;
        notif.textContent = `Filling field ${current} of ${total}...`;
        document.body.appendChild(notif);
        setTimeout(() => notif.remove(), 2000);
    }
}

// Show AI enhancement option for unknown fields
function showAIEnhancementOption(
    form: HTMLFormElement | HTMLElement,
    unknownFields: any[],
    fieldsMetadata: any[]
) {
    // Create floating button for AI enhancement
    const enhanceBtn = document.createElement('div');
    enhanceBtn.style.cssText = `
        position: fixed; bottom: 20px; right: 20px;
        background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
        color: white; padding: 12px 20px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483646;
        font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;
        cursor: pointer; display: flex; align-items: center; gap: 8px;
        transition: transform 0.2s;
    `;
    enhanceBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 12h8M12 8v8"></path>
        </svg>
        <span>Fill ${unknownFields.length} more with AI?</span>
    `;

    enhanceBtn.addEventListener('mouseenter', () => {
        enhanceBtn.style.transform = 'translateY(-2px)';
    });
    enhanceBtn.addEventListener('mouseleave', () => {
        enhanceBtn.style.transform = 'translateY(0)';
    });

    enhanceBtn.addEventListener('click', async () => {
        enhanceBtn.remove();
        await fillUnknownFieldsWithAI(form, unknownFields, fieldsMetadata);
    });

    document.body.appendChild(enhanceBtn);

    // Auto-remove after 10 seconds
    setTimeout(() => enhanceBtn.remove(), 10000);
}

// Fill unknown fields using AI
async function fillUnknownFieldsWithAI(
    form: HTMLFormElement | HTMLElement,
    unknownFields: any[],
    fieldsMetadata: any[]
) {
    showNotification('🤖 AI analyzing remaining fields...', 'info');

    try {
        const result = await chrome.storage.local.get(['access_token', 'gemini_api_key']);
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${result.access_token}`,
            'Content-Type': 'application/json',
        };
        if (result.gemini_api_key) {
            headers['x-gemini-api-key'] = result.gemini_api_key;
        }

        // Send only unknown fields to AI
        const unknownFieldsMetadata = unknownFields.map(uf => {
            const idx = parseInt(uf.field_id.replace('field_', ''));
            return fieldsMetadata[idx];
        });

        const response = await fetch('http://localhost:3000/v1/mapping/agent-fill', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                fields: unknownFieldsMetadata,
                url: window.location.href,
            }),
        });

        if (!response.ok) throw new Error('AI API failed');
        const data = await response.json();
        const aiResults = data.results || [];

        // Fill AI results
        const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
        let aiFilledCount = 0;

        for (const res of aiResults) {
            if (res.action === 'skip') continue;

            // Find original field index
            const originalFieldId = unknownFields.find((uf, i) =>
                `field_${i}` === res.field_id
            )?.field_id;

            if (originalFieldId) {
                const idx = parseInt(originalFieldId.replace('field_', ''));
                const element = elements[idx];

                if (element && res.value) {
                    await fillField(element, res.value);
                    aiFilledCount++;
                }
            }
        }

        if (aiFilledCount > 0) {
            showNotification(`✓ AI filled ${aiFilledCount} more fields!`, 'success');
        } else {
            showNotification('AI could not fill remaining fields', 'info');
        }

    } catch (error) {
        console.error('[Autofill] AI enhancement failed:', error);
        showNotification('AI enhancement unavailable', 'error');
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