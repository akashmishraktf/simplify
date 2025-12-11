import { mapFormFields, fillField, calculateTotalExperience } from './utils/fieldMapper';

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

// Create autofill button overlay
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

// Generate page signature for caching
function generatePageSignature(form: HTMLFormElement | HTMLElement): string {
    const fields = Array.from(form.querySelectorAll('input, select, textarea'))
        .filter((f: any) => f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button')
        .map((f: any) => `${f.type}:${f.name || f.id}`)
        .join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fields.length; i++) {
        const char = fields.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return `form_${Math.abs(hash).toString(36)}`;
}

// Get comprehensive field metadata for agent
function getFormFieldsMetadata(form: HTMLFormElement | HTMLElement): any[] {
    const fields: any[] = [];
    const elements = form.querySelectorAll('input, select, textarea');
    const processedRadioGroups = new Set<string>();

    elements.forEach((element: any, index) => {
        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button' || element.type === 'image' || element.type === 'reset') {
            return;
        }

        // Skip if not visible
        if (element.offsetParent === null && element.type !== 'radio' && element.type !== 'checkbox') {
            return;
        }

        // Get label - try multiple strategies
        let label = '';
        
        // Strategy 1: label[for] attribute
        if (element.id) {
            const labelEl = document.querySelector(`label[for="${element.id}"]`);
            if (labelEl) label = labelEl.textContent?.trim() || '';
        }
        
        // Strategy 2: Parent label
        if (!label) {
            const parentLabel = element.closest('label');
            if (parentLabel) {
                label = parentLabel.textContent?.trim() || '';
                // Remove the input value from label text
                if (element.value && label.includes(element.value)) {
                    label = label.replace(element.value, '').trim();
                }
            }
        }
        
        // Strategy 3: Nearby label in parent container
        if (!label) {
            const parent = element.closest('div, td, li, fieldset, section');
            if (parent) {
                const labelEl = parent.querySelector('label, legend, .label, [class*="label"]');
                if (labelEl && !labelEl.querySelector('input, select, textarea')) {
                    label = labelEl.textContent?.trim() || '';
                }
            }
        }
        
        // Strategy 4: Preceding text node or span
        if (!label) {
            const parent = element.parentElement;
            if (parent) {
                const childNodes = Array.from(parent.childNodes) as ChildNode[];
                const precedingText = childNodes
                    .filter((node) => node.nodeType === Node.TEXT_NODE || (node as Element).tagName === 'SPAN')
                    .map((node) => node.textContent?.trim())
                    .filter(Boolean)
                    .join(' ');
                if (precedingText && precedingText.length < 100) {
                    label = precedingText;
                }
            }
        }

        // Get surrounding context (section headers, etc.)
        let sectionTitle = '';
        const section = element.closest('fieldset, section, [class*="section"], [class*="group"]');
        if (section) {
            const header = section.querySelector('legend, h1, h2, h3, h4, h5, h6, [class*="title"], [class*="header"]');
            if (header) {
                sectionTitle = header.textContent?.trim() || '';
            }
        }

        // Get surrounding text for context
        let surroundingText = '';
        const container = element.closest('div, td, li');
        if (container) {
            const helpText = container.querySelector('.help-text, .hint, .description, [class*="help"], [class*="hint"], small');
            if (helpText) {
                surroundingText = helpText.textContent?.trim() || '';
            }
        }

        // Determine element type
        let elementType: 'input' | 'select' | 'textarea' | 'radio' | 'checkbox' = 'input';
        if (element.tagName === 'SELECT') elementType = 'select';
        else if (element.tagName === 'TEXTAREA') elementType = 'textarea';
        else if (element.type === 'radio') elementType = 'radio';
        else if (element.type === 'checkbox') elementType = 'checkbox';

        // Handle radio button groups - collect all options
        if (element.type === 'radio') {
            const groupName = element.name;
            if (processedRadioGroups.has(groupName)) return;
            processedRadioGroups.add(groupName);

            const radioButtons = form.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
            const options: { value: string; text: string; selected: boolean }[] = [];
            
            radioButtons.forEach((radio: any) => {
                let radioLabel = '';
                // Get label for this radio
                if (radio.id) {
                    const labelEl = document.querySelector(`label[for="${radio.id}"]`);
                    if (labelEl) radioLabel = labelEl.textContent?.trim() || '';
                }
                if (!radioLabel) {
                    const parentLabel = radio.closest('label');
                    if (parentLabel) radioLabel = parentLabel.textContent?.trim().replace(radio.value, '').trim() || '';
                }
                if (!radioLabel) radioLabel = radio.value;
                
                options.push({
                    value: radio.value,
                    text: radioLabel,
                    selected: radio.checked
                });
            });

            fields.push({
                field_id: `field_${index}`,
                element_type: 'radio',
                input_type: 'radio',
                name: groupName,
                id: element.id || '',
                placeholder: '',
                label: label || sectionTitle,
                aria_label: element.getAttribute('aria-label') || '',
                required: element.required || false,
                options: options,
                group_name: groupName,
                surrounding_text: surroundingText,
                section_title: sectionTitle,
            });
            return;
        }

        // Handle select dropdowns - collect all options
        let options: { value: string; text: string; selected: boolean }[] | undefined;
        if (element.tagName === 'SELECT') {
            options = Array.from(element.options).map((opt: any) => ({
                value: opt.value,
                text: opt.text?.trim() || opt.value,
                selected: opt.selected
            })).filter((opt: any) => opt.value); // Filter out empty options
        }

        // Handle checkbox groups
        if (element.type === 'checkbox' && element.name) {
            const groupName = element.name;
            // Check if this is part of a group (same name, multiple checkboxes)
            const checkboxes = form.querySelectorAll(`input[type="checkbox"][name="${groupName}"]`);
            if (checkboxes.length > 1) {
                if (processedRadioGroups.has(`checkbox_${groupName}`)) return;
                processedRadioGroups.add(`checkbox_${groupName}`);

                const cbOptions: { value: string; text: string; selected: boolean }[] = [];
                checkboxes.forEach((cb: any) => {
                    let cbLabel = '';
                    if (cb.id) {
                        const labelEl = document.querySelector(`label[for="${cb.id}"]`);
                        if (labelEl) cbLabel = labelEl.textContent?.trim() || '';
                    }
                    if (!cbLabel) {
                        const parentLabel = cb.closest('label');
                        if (parentLabel) cbLabel = parentLabel.textContent?.trim() || '';
                    }
                    if (!cbLabel) cbLabel = cb.value;
                    
                    cbOptions.push({
                        value: cb.value,
                        text: cbLabel,
                        selected: cb.checked
                    });
                });

                fields.push({
                    field_id: `field_${index}`,
                    element_type: 'checkbox',
                    input_type: 'checkbox',
                    name: groupName,
                    id: element.id || '',
                    placeholder: '',
                    label: label || sectionTitle,
                    aria_label: element.getAttribute('aria-label') || '',
                    required: element.required || false,
                    options: cbOptions,
                    group_name: groupName,
                    surrounding_text: surroundingText,
                    section_title: sectionTitle,
                });
                return;
            }
        }

        fields.push({
            field_id: `field_${index}`,
            element_type: elementType,
            input_type: element.type || '',
            name: element.name || '',
            id: element.id || '',
            placeholder: element.placeholder || '',
            label: label,
            aria_label: element.getAttribute('aria-label') || '',
            required: element.required || false,
            options: options,
            current_value: element.value || '',
            surrounding_text: surroundingText,
            section_title: sectionTitle,
        });
    });

    return fields;
}

// Smart fill a single field based on agent result
function smartFillField(
    form: HTMLFormElement | HTMLElement,
    result: {
        field_id: string;
        action: 'fill' | 'select' | 'check' | 'skip';
        value: string | string[] | boolean;
        confidence: number;
        reasoning: string;
    },
    elements: NodeListOf<Element>,
    fieldMetadata: any[]
): boolean {
    if (result.action === 'skip' || result.confidence < 0.3) {
        return false;
    }

    const fieldIndex = parseInt(result.field_id.replace('field_', ''));
    const metadata = fieldMetadata.find(f => f.field_id === result.field_id);
    
    if (!metadata) {
        console.warn(`[Simplify-for-India] No metadata found for ${result.field_id}`);
        return false;
    }

    try {
        // Handle radio buttons
        if (metadata.element_type === 'radio' && metadata.group_name) {
            const radios = form.querySelectorAll(`input[type="radio"][name="${metadata.group_name}"]`);
            for (const radio of Array.from(radios) as HTMLInputElement[]) {
                if (radio.value === result.value) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                    radio.dispatchEvent(new Event('input', { bubbles: true }));
                    console.log(`[Simplify-for-India] Selected radio: ${result.value} (${result.reasoning})`);
                    return true;
                }
            }
            // Try text match if value didn't match
            for (const radio of Array.from(radios) as HTMLInputElement[]) {
                const labelEl = document.querySelector(`label[for="${radio.id}"]`);
                const labelText = labelEl?.textContent?.toLowerCase() || '';
                if (labelText.includes(String(result.value).toLowerCase())) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`[Simplify-for-India] Selected radio by label: ${radio.value}`);
                    return true;
                }
            }
            return false;
        }

        // Handle checkbox groups
        if (metadata.element_type === 'checkbox' && metadata.group_name && Array.isArray(result.value)) {
            const checkboxes = form.querySelectorAll(`input[type="checkbox"][name="${metadata.group_name}"]`);
            let filled = false;
            for (const cb of Array.from(checkboxes) as HTMLInputElement[]) {
                const shouldCheck = (result.value as string[]).includes(cb.value);
                if (cb.checked !== shouldCheck) {
                    cb.checked = shouldCheck;
                    cb.dispatchEvent(new Event('change', { bubbles: true }));
                    filled = true;
                }
            }
            if (filled) {
                console.log(`[Simplify-for-India] Set checkboxes: ${result.value} (${result.reasoning})`);
            }
            return filled;
        }

        // Handle single checkbox
        if (metadata.element_type === 'checkbox' || metadata.input_type === 'checkbox') {
            const element = Array.from(elements)[fieldIndex] as HTMLInputElement;
            if (element && element.type === 'checkbox') {
                const shouldCheck = result.value === true || result.value === 'true' || result.value === '1';
                if (element.checked !== shouldCheck) {
                    element.checked = shouldCheck;
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                    console.log(`[Simplify-for-India] Set checkbox: ${shouldCheck} (${result.reasoning})`);
                    return true;
                }
            }
            return false;
        }

        // Get the element for regular fields
        const element = Array.from(elements)[fieldIndex] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (!element) {
            console.warn(`[Simplify-for-India] Element not found for ${result.field_id}`);
            return false;
        }

        if (element.type === 'hidden' || element.type === 'submit' || element.type === 'button' || element.type === 'file') {
            return false;
        }

        // Check if disabled or readonly
        if ((element as HTMLInputElement).disabled || (element as HTMLInputElement).readOnly) {
            return false;
        }

        const valueToFill = String(result.value);

        // Handle select dropdowns
        if (element instanceof HTMLSelectElement) {
            const options = Array.from(element.options);
            
            // Try exact value match
            let matched = options.find(opt => opt.value === valueToFill);
            
            // Try case-insensitive value match
            if (!matched) {
                matched = options.find(opt => opt.value.toLowerCase() === valueToFill.toLowerCase());
            }
            
            // Try text match
            if (!matched) {
                matched = options.find(opt => opt.text.toLowerCase() === valueToFill.toLowerCase());
            }
            
            // Try partial match
            if (!matched) {
                matched = options.find(opt => 
                    opt.text.toLowerCase().includes(valueToFill.toLowerCase()) ||
                    valueToFill.toLowerCase().includes(opt.text.toLowerCase())
                );
            }

            // Try fuzzy match (word overlap)
            if (!matched) {
                const searchWords = valueToFill.toLowerCase().split(/\s+/);
                let bestMatch: HTMLOptionElement | null = null;
                let bestScore = 0;
                
                for (const opt of options) {
                    if (!opt.value) continue;
                    const optText = opt.text.toLowerCase();
                    let score = 0;
                    for (const word of searchWords) {
                        if (word.length > 2 && optText.includes(word)) score += word.length;
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = opt;
                    }
                }
                
                if (bestScore >= 3 && bestMatch) {
                    matched = bestMatch;
                }
            }

            if (matched) {
                element.value = matched.value;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                element.dispatchEvent(new Event('input', { bubbles: true }));
                console.log(`[Simplify-for-India] Selected: "${matched.text}" (${result.reasoning})`);
                return true;
            } else {
                console.warn(`[Simplify-for-India] No matching option for: ${valueToFill}`);
                return false;
            }
        }

        // Handle text inputs and textareas
        element.focus();
        
        // Respect maxlength
        let finalValue = valueToFill;
        if ((element as HTMLInputElement).maxLength && (element as HTMLInputElement).maxLength > 0) {
            finalValue = finalValue.substring(0, (element as HTMLInputElement).maxLength);
        }

        // Use native setter for React compatibility
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            element instanceof HTMLTextAreaElement 
                ? window.HTMLTextAreaElement.prototype 
                : window.HTMLInputElement.prototype,
            'value'
        )?.set;

        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, finalValue);
        } else {
            element.value = finalValue;
        }

        // Dispatch events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));

        console.log(`[Simplify-for-India] Filled: "${finalValue.substring(0, 50)}${finalValue.length > 50 ? '...' : ''}" (${result.reasoning})`);
        return true;

    } catch (error) {
        console.error(`[Simplify-for-India] Error filling ${result.field_id}:`, error);
        return false;
    }
}

// Autofill the form with profile data using AI Agent
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

    console.log('[Simplify-for-India] Starting AI Agent autofill...');

    // Get comprehensive field metadata
    const fieldsMetadata = getFormFieldsMetadata(form);
    console.log('[Simplify-for-India] Analyzing', fieldsMetadata.length, 'fields with full context');

    if (fieldsMetadata.length === 0) {
        showNotification('No fillable fields found', 'info');
        return;
    }

    showNotification('🤖 AI Agent analyzing form...', 'info');

    try {
        // Call AI Agent endpoint
        const result = await chrome.storage.local.get(['access_token']);
        const response = await fetch('http://localhost:3000/v1/mapping/agent-fill', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${result.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: fieldsMetadata,
                url: window.location.href,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Simplify-for-India] Agent API error:', errorText);
            throw new Error(`Agent API failed: ${response.status}`);
        }

        const data = await response.json();
        const results = data.results || [];

        console.log('[Simplify-for-India] Agent results:', results.length, 'fields');

        if (results.length === 0) {
            showNotification('❌ No fields could be filled', 'error');
            return;
        }

        // Get all form elements
        const elements = form.querySelectorAll('input, select, textarea');

        // Fill fields based on agent results
        let filledCount = 0;
        let skippedCount = 0;

        for (const result of results) {
            try {
                if (result.action === 'skip') {
                    skippedCount++;
                    continue;
                }

                // Check if this field type is enabled in options
                // Map some common field types to enabled fields
                const fieldMeta = fieldsMetadata.find((f: any) => f.field_id === result.field_id);
                if (fieldMeta) {
                    const searchText = `${fieldMeta.name} ${fieldMeta.id} ${fieldMeta.label}`.toLowerCase();
                    // Check various field type patterns against enabled options
                    const fieldTypeChecks: [RegExp, string][] = [
                        [/first[\s_-]?name/i, 'firstName'],
                        [/last[\s_-]?name/i, 'lastName'],
                        [/full[\s_-]?name|^name$/i, 'fullName'],
                        [/email/i, 'email'],
                        [/phone|mobile/i, 'phoneNumber'],
                        [/address/i, 'address'],
                        [/location|city/i, 'location'],
                        [/company/i, 'company'],
                        [/notice/i, 'noticePeriod'],
                        [/current[\s_-]?(ctc|salary)/i, 'currentCtc'],
                        [/expected[\s_-]?(ctc|salary)/i, 'expectedCtc'],
                        [/linkedin/i, 'linkedinUrl'],
                        [/github/i, 'githubUrl'],
                        [/portfolio/i, 'portfolioUrl'],
                        [/cover[\s_-]?letter/i, 'coverLetter'],
                        [/experience/i, 'experience'],
                        [/skills/i, 'skills'],
                        [/education/i, 'education'],
                    ];

                    for (const [pattern, fieldKey] of fieldTypeChecks) {
                        if (pattern.test(searchText)) {
                            if (autofillOptions.enabledFields?.[fieldKey] === false) {
                                console.log(`[Simplify-for-India] Skipping disabled field: ${fieldKey}`);
                                skippedCount++;
                                continue;
                            }
                            break;
                        }
                    }
                }

                if (autofillOptions.dryRun) {
                    // Preview mode - just highlight
                    const fieldIndex = parseInt(result.field_id.replace('field_', ''));
                    const element = Array.from(elements)[fieldIndex] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
                    if (element && result.action !== 'skip') {
                        highlightField(element, result.value);
                        filledCount++;
                        console.log(`[Simplify-for-India] Preview: ${result.value} (${result.reasoning})`);
                    }
                    continue;
                }

                const filled = smartFillField(form, result, elements, fieldsMetadata);
                if (filled) {
                    filledCount++;
                } else {
                    skippedCount++;
                }

            } catch (fieldError) {
                console.error('[Simplify-for-India] Error processing field result:', fieldError);
                skippedCount++;
            }
        }

        console.log(`[Simplify-for-India] Filled: ${filledCount}, Skipped: ${skippedCount}`);

        // Show success message
        if (autofillOptions.dryRun) {
            showNotification(`Previewed ${filledCount} fields (no data written)`, 'info');
        } else {
            showNotification(`✓ AI Agent filled ${filledCount} fields!`, 'success');
        }

        // Track this application
        if (!autofillOptions.dryRun && filledCount > 0) {
            trackApplication(form);
        }

    } catch (error) {
        console.error('[Simplify-for-India] AI Agent autofill failed:', error);
        showNotification('❌ Autofill failed. Please try again.', 'error');
    }
}

// Show notification
function showNotification(message: string, type: 'success' | 'error' | 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Track application (save to backend)
async function trackApplication(form: HTMLFormElement | HTMLElement) {
    try {
        const result = await chrome.storage.local.get(['access_token']);
        if (!result.access_token) return;

        const jobData = {
            url: window.location.href,
            company: document.title || window.location.hostname,
            dateApplied: new Date().toISOString(),
        };

        await fetch('http://localhost:3000/v1/applications', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${result.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jobData),
        });

        console.log('[Simplify-for-India] Application tracked');
    } catch (err) {
        console.error('[Simplify-for-India] Failed to track application:', err);
    }
}

// Score a form to determine if it's a job application form
function scoreForm(form: HTMLFormElement): number {
    let score = 0;

    const allFields = form.querySelectorAll('input, select, textarea');
    const visibleFields = Array.from(allFields).filter((f: any) =>
        f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button' &&
        f.type !== 'image' && f.type !== 'reset'
    );

    // Must have minimum fields (lowered to catch smaller forms)
    if (visibleFields.length < 3) return -5;

    // Score by field count (more fields = likely main application)
    score += Math.min(visibleFields.length * 2, 50);

    const textareaCount = Array.from(allFields).filter((f: any) => f.tagName === 'TEXTAREA').length;
    if (textareaCount > 0) score += 8; // cover letter / summaries often use textarea

    // Get all searchable text
    const formText = Array.from(allFields).map((f: any) =>
        `${f.name || ''} ${f.id || ''} ${f.placeholder || ''} ${f.getAttribute('aria-label') || ''}`
    ).join(' ').toLowerCase();

    // Get labels
    const labels = Array.from(form.querySelectorAll('label')).map(l => l.textContent?.toLowerCase() || '').join(' ');
    const allText = `${formText} ${labels}`;

    // Strong indicators of job application form
    if (/resume|cv|curriculum[\s_-]?vitae/i.test(allText)) score += 35;
    if (/experience|years[\s_-]?of[\s_-]?experience/i.test(allText)) score += 20;
    if (/(salary|ctc|compensation|expected[\s_-]?ctc|current[\s_-]?ctc|package)/i.test(allText)) score += 20;
    if (/notice[\s_-]?period|joining[\s_-]?date/i.test(allText)) score += 20;
    if (/(phone|mobile|contact[\s_-]?number)/i.test(allText)) score += 12;
    if (/(first[\s_-]?name|last[\s_-]?name|full[\s_-]?name)/i.test(allText)) score += 12;
    if (/email/i.test(allText)) score += 10;
    if (/(cover[\s_-]?letter|motivation|statement)/i.test(allText)) score += 12;
    if (/(linkedin|portfolio|github)/i.test(allText)) score += 10;
    if (/(address|city|state|country|pincode|postal|zip|location)/i.test(allText)) score += 10;
    if (/(education|qualification|degree|university|college|institution)/i.test(allText)) score += 10;
    if (/(company|employer|organisation|designation|position|role)/i.test(allText)) score += 12;
    if (/(apply|application)/i.test(allText)) score += 10;

    // Look for file upload (resume)
    const fileInputs = Array.from(allFields).filter((f: any) => f.type === 'file');
    if (fileInputs.length > 0) score += 25;

    // Buttons with apply/submit keywords
    const buttons = Array.from(form.querySelectorAll('button, input[type="submit"], input[type="button"]'));
    const buttonText = buttons.map((b: any) => (b.textContent || b.value || '').toLowerCase()).join(' ');
    if (/(apply|submit|next|continue)/i.test(buttonText)) score += 10;
    if (/(upload|resume|cv)/i.test(buttonText)) score += 8;

    // Presence of selects/radios/checks often used for location/type
    const selects = Array.from(form.querySelectorAll('select'));
    const radios = Array.from(form.querySelectorAll('input[type="radio"]'));
    if (selects.length > 0) score += 6;
    if (radios.length > 2) score += 4;

    // Negative indicators (forms we want to skip)
    if (/(search|query)/i.test(formText)) score -= 30;
    if (/(filter|sort)/i.test(formText)) score -= 20;
    if (/(newsletter|subscribe)/i.test(allText)) score -= 40;
    if (/(talent[\s_-]?community|join[\s_-]?our|stay[\s_-]?connected)/i.test(allText)) score -= 50;
    if (/(sign[\s_-]?up|register|login|log[\s_-]?in)/i.test(form.id + form.className)) score -= 30;
    if (visibleFields.length < 5) score -= 8; // Prefer longer forms

    // Check form action/id for clues
    const formAction = (form.action || '').toLowerCase();
    const formIdClass = `${form.id} ${form.className}`.toLowerCase();
    if (/(apply|application|job|career)/i.test(formAction)) score += 20;
    if (/(newsletter|subscribe|community|talent[\s_-]?network)/i.test(formAction)) score -= 40;
    if (/(apply|application|job|career)/i.test(formIdClass)) score += 15;

    console.log(`[Simplify-for-India] Form score: ${score} (${visibleFields.length} fields)`);

    return score;
}

// Find the best container with input fields (for sites without <form> tags)
function findVirtualForms(): HTMLElement[] {
    const virtualForms: HTMLElement[] = [];
    
    // Look for common container patterns that hold form fields
    const selectors = [
        // Common job portal patterns
        '[data-testid*="application"]',
        '[data-testid*="form"]',
        '[data-testid*="apply"]',
        '[class*="application-form"]',
        '[class*="apply-form"]',
        '[class*="job-form"]',
        '[class*="job-application"]',
        '[class*="candidate-form"]',
        '[class*="ApplicationForm"]',
        '[class*="ApplyForm"]',
        '[id*="application"]',
        '[id*="apply-form"]',
        '[id*="applyForm"]',
        // Greenhouse specific
        '[id="application"]',
        '[class*="greenhouse"]',
        // Lever specific  
        '[class*="lever"]',
        '[class*="application-questions"]',
        // Workday specific
        '[class*="workday"]',
        '[data-automation-id*="application"]',
        // Generic form containers
        '[role="form"]',
        '[class*="form-container"]',
        '[class*="formContainer"]',
        '[class*="form-wrapper"]',
        '[class*="formWrapper"]',
        // Standard HTML5 semantic elements
        'main',
        'article',
        '[role="main"]',
        'section',
        // Modal/dialog forms
        '[role="dialog"] [class*="form"]',
        '[class*="modal"] [class*="form"]',
        '[class*="Modal"] [class*="Form"]',
    ];
    
    for (const selector of selectors) {
        const containers = document.querySelectorAll(selector);
        containers.forEach((container) => {
            const inputs = container.querySelectorAll('input, select, textarea');
            const visibleInputs = Array.from(inputs).filter((f: any) =>
                f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button' &&
                f.type !== 'image' && f.type !== 'reset' && f.offsetParent !== null
            );
            if (visibleInputs.length >= 3) {
                virtualForms.push(container as HTMLElement);
            }
        });
    }
    
    // Also check for any container that has multiple input fields
    if (virtualForms.length === 0) {
        const allInputs = document.querySelectorAll('input, select, textarea');
        const visibleInputs = Array.from(allInputs).filter((f: any) =>
            f.type !== 'hidden' && f.type !== 'submit' && f.type !== 'button' &&
            f.type !== 'image' && f.type !== 'reset' && f.offsetParent !== null
        );
        
        if (visibleInputs.length >= 3) {
            // Find common ancestor of all inputs
            const ancestors = new Map<HTMLElement, number>();
            visibleInputs.forEach((input) => {
                let parent = input.parentElement;
                let depth = 0;
                while (parent && parent !== document.body && depth < 10) {
                    const count = (ancestors.get(parent) || 0) + 1;
                    ancestors.set(parent, count);
                    parent = parent.parentElement;
                    depth++;
                }
            });
            
            // Find the smallest container that contains most inputs
            let bestContainer: HTMLElement | null = null;
            let bestScore = 0;
            ancestors.forEach((count, container) => {
                const containerInputs = container.querySelectorAll('input, select, textarea').length;
                const score = count / (containerInputs + 1); // Prefer tighter containers
                if (count >= 3 && score > bestScore) {
                    bestScore = score;
                    bestContainer = container;
                }
            });
            
            if (bestContainer) {
                virtualForms.push(bestContainer);
            }
        }
    }
    
    // Deduplicate - remove containers that are children of other containers
    const deduplicated = virtualForms.filter((container, index) => {
        return !virtualForms.some((other, otherIndex) => 
            otherIndex !== index && other.contains(container) && other !== container
        );
    });
    
    return deduplicated;
}

// Score a container (virtual form) to determine if it's a job application form
function scoreVirtualForm(container: HTMLElement): number {
    // Create a pseudo-form object to reuse scoring logic
    const pseudoForm = {
        querySelectorAll: (selector: string) => container.querySelectorAll(selector),
        id: container.id || '',
        className: container.className || '',
        action: '',
        getAttribute: (attr: string) => container.getAttribute(attr),
    } as unknown as HTMLFormElement;
    
    return scoreForm(pseudoForm);
}

// Detect and add autofill button to BEST form only
function detectForms() {
    const forms = document.querySelectorAll('form');
    console.log(`[Simplify-for-India] Detected ${forms.length} form elements`);

    let scoredForms: { form: HTMLFormElement | HTMLElement; score: number; isVirtual?: boolean }[] = [];

    // Score actual form elements
    if (forms.length > 0) {
        scoredForms = Array.from(forms).map((form) => ({
            form: form as HTMLFormElement,
            score: scoreForm(form as HTMLFormElement),
            isVirtual: false,
        }));
    }

    // If no forms or no forms scored positively, look for virtual forms
    const positiveScoreForms = scoredForms.filter(f => f.score > 0);
    if (positiveScoreForms.length === 0) {
        console.log('[Simplify-for-India] No positive-scoring forms, looking for virtual forms...');
        const virtualForms = findVirtualForms();
        console.log(`[Simplify-for-India] Found ${virtualForms.length} virtual form containers`);
        
        virtualForms.forEach((container) => {
            const score = scoreVirtualForm(container);
            scoredForms.push({
                form: container,
                score: score,
                isVirtual: true,
            });
        });
    }

    // If nothing scored positive, fall back to the largest form/container with at least 3 visible fields
    let candidateForms = scoredForms.filter(f => f.score > 0);
    if (candidateForms.length === 0) {
        candidateForms = scoredForms
            .map((f) => ({
                ...f,
                fallback: true,
                // use visible field count as score for fallback
                score: Math.max(
                    f.score,
                    (f.form.querySelectorAll('input, select, textarea').length || 0) * 1.5
                ),
            }))
            .filter((f) => f.form.querySelectorAll('input, select, textarea').length >= 3);
        if (candidateForms.length === 0) {
            console.log('[Simplify-for-India] No suitable forms even after fallback');
            return;
        }
        console.log('[Simplify-for-India] Using fallback scoring to pick a form');
    }

    if (candidateForms.length === 0) return;

    // Sort by score (highest first)
    candidateForms.sort((a, b) => b.score - a.score);

    // Only show button on the highest scoring form
    const bestForm = candidateForms[0];
    console.log(`[Simplify-for-India] Best form score: ${bestForm.score}${bestForm.isVirtual ? ' (virtual form)' : ''}`);

    // Remove old buttons
    autofillButtons.forEach(btn => {
        try {
            if (btn.parentNode) btn.parentNode.removeChild(btn);
        } catch (e) {
            console.error('[Simplify-for-India] Error removing button:', e);
        }
    });
    autofillButtons = [];

    // Add button to best form
    try {
        const formEl = bestForm.form;
        const formId = formEl.id || formEl.getAttribute('name') || `form-${Date.now()}`;
        const button = createAutofillButton(formEl);
        button.setAttribute('data-form-id', formId);
        document.body.appendChild(button);
        autofillButtons.push(button);

        const fieldCount = formEl.querySelectorAll('input, select, textarea').length;
        console.log(`[Simplify-for-India] Added button to ${bestForm.isVirtual ? 'virtual ' : ''}form (${fieldCount} total fields, score: ${bestForm.score})`);
    } catch (e) {
        console.error('[Simplify-for-India] Error adding button:', e);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Throttle function to prevent excessive calls
let detectFormsTimeout: any = null;
let lastDetectTime = 0;
function throttledDetectForms() {
    if (detectFormsTimeout) {
        clearTimeout(detectFormsTimeout);
    }
    
    // Force detect immediately if it's been more than 5 seconds
    const now = Date.now();
    if (now - lastDetectTime > 5000) {
        lastDetectTime = now;
        try {
            detectForms();
        } catch (error) {
            console.error('[Simplify-for-India] Error in detectForms:', error);
        }
        return;
    }
    
    detectFormsTimeout = setTimeout(() => {
        lastDetectTime = Date.now();
        try {
            detectForms();
        } catch (error) {
            console.error('[Simplify-for-India] Error in detectForms:', error);
        }
    }, 500); // Reduced from 1000ms to 500ms for faster response
}

// Initialize
console.log('[Simplify-for-India] Initializing...');
loadProfile().catch(err => console.error('[Simplify-for-India] Profile load error:', err));
loadAutofillOptions().catch(err => console.error('[Simplify-for-India] Options load error:', err));

// Wait for page to fully load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Simplify-for-India] DOMContentLoaded - detecting forms');
        throttledDetectForms();
    });
} else {
    console.log('[Simplify-for-India] Page already loaded - detecting forms');
    throttledDetectForms();
}

// Also detect on window load (for late-loading content)
window.addEventListener('load', () => {
    console.log('[Simplify-for-India] Window loaded - detecting forms');
    setTimeout(throttledDetectForms, 500);
});

// Periodic check for SPAs that load forms very late (every 3 seconds for first 30 seconds)
let periodicCheckCount = 0;
const periodicCheck = setInterval(() => {
    periodicCheckCount++;
    if (periodicCheckCount > 10) {
        clearInterval(periodicCheck);
        return;
    }
    if (autofillButtons.length === 0) {
        console.log('[Simplify-for-India] Periodic check - no button yet, detecting forms');
        throttledDetectForms();
    }
}, 3000);

// Observe DOM changes for SPA navigation (throttled)
const observer = new MutationObserver(throttledDetectForms);
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Expose debug functions to window for troubleshooting
(window as any).__simplifyDebug = {
    detectForms: () => {
        console.log('[Simplify-for-India] Manual detection triggered');
        detectForms();
    },
    getProfile: () => currentProfile,
    getButtons: () => autofillButtons,
    findVirtualForms: () => {
        const vf = findVirtualForms();
        console.log('[Simplify-for-India] Virtual forms found:', vf.length);
        vf.forEach((f, i) => {
            console.log(`  ${i + 1}. Tag: ${f.tagName}, Class: ${f.className}, ID: ${f.id}`);
            console.log(`     Inputs: ${f.querySelectorAll('input, select, textarea').length}`);
        });
        return vf;
    },
    scoreAllForms: () => {
        const forms = document.querySelectorAll('form');
        console.log('[Simplify-for-India] Scoring all forms:');
        forms.forEach((f, i) => {
            const score = scoreForm(f as HTMLFormElement);
            console.log(`  Form ${i + 1}: score=${score}, fields=${f.querySelectorAll('input, select, textarea').length}`);
        });
    },
};
console.log('[Simplify-for-India] Debug: use window.__simplifyDebug.detectForms() to manually trigger');
