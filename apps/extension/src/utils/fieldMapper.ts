// Field mapping heuristics for Indian job portals

const FIELD_PATTERNS = {
    firstName: [
        /\bfirst[\s_-]?name\b/i,
        /\bfname\b/i,
        /\bgiven[\s_-]?name\b/i,
    ],
    lastName: [
        /\blast[\s_-]?name\b/i,
        /\blname\b/i,
        /\bsurname\b/i,
        /\bfamily[\s_-]?name\b/i,
    ],
    fullName: [
        /\b(full|first|candidate|applicant)[\s_-]?(name)\b/i,
        /\bname\b/i,
        /\bcandidate[\s_-]?name\b/i,
        /^name$/i
    ],
    email: [
        /\b(email|e-mail|mail)[\s_-]?(address|id)?\b/i,
    ],
    phoneNumber: [
        /\b(phone|mobile|contact|cell)[\s_-]?(number|no\.?)?\b/i,
        /\btel(ephone)?\b/i,
    ],
    address: [
        /\baddress\b/i,
        /\bstreet\b/i,
        /\bline[\s_-]?\d\b/i,
        /\bpincode\b/i,
        /\bpostal\b/i,
        /\bzip\b/i,
    ],
    currentLocation: [
        /\b(current|present)[\s_-]?(location|city|address)\b/i,
        /\blocation\b/i,
        /\bcity\b/i,
    ],
    preferredLocation: [
        /\b(preferred|desired|target)[\s_-]?(location|city)\b/i,
        /\bpreferred[\s_-]?work[\s_-]?location\b/i,
    ],
    location: [
        /\blocation\b/i,
        /\bcity\b/i,
        /\btown\b/i,
    ],
    noticePeriod: [
        /\bnotice[\s_-]?period\b/i,
        /\bjoining[\s_-]?(period|time|date)\b/i,
        /\bhow[\s_-]?soon\b/i,
        /\bstart[\s_-]?date\b/i
    ],
    currentCtc: [
        /\b(current|present|existing)[\s_-]?(ctc|salary|compensation|package)\b/i,
        /\bcurrent[\s_-]?annual[\s_-]?salary\b/i
    ],
    expectedCtc: [
        /\b(expected|desired|target)[\s_-]?(ctc|salary|compensation|package)\b/i,
    ],
    desiredSalary: [
        /\bdesired[\s_-]?(salary|ctc|compensation|package)\b/i,
        /\bsalary[\s_-]?expectations?\b/i,
    ],
    experience: [
        /\b(total|years[\s_-]?of)[\s_-]?experience\b/i,
        /\bexperience[\s_-]?(years|in[\s_-]?years)?\b/i,
    ],
    skills: [
        /\b(skills|technologies|tech[\s_-]?stack|expertise)\b/i,
        /\bkey[\s_-]?skills\b/i,
    ],
    education: [
        /\b(education|qualification|degree)\b/i,
        /\bhighest[\s_-]?qualification\b/i,
    ],
    institution: [
        /\b(college|university|institution|school)\b/i,
    ],
    currentCompany: [
        /\bcurrent[\s_-]?(company|employer|organization|organisation)\b/i,
        /\bmost[\s_-]?recent[\s_-]?employer\b/i,
    ],
    company: [
        /\b(company|employer|organization|organisation)\b/i,
        /\bcurrent[\s_-]?company\b/i,
    ],
    jobTitle: [
        /\b(designation|position|role|job[\s_-]?title)\b/i,
        /\bcurrent[\s_-]?(designation|position|role)\b/i,
    ],
    resume: [
        /\b(resume|cv|curriculum[\s_-]?vitae)\b/i,
        /\bupload[\s_-]?(resume|cv)\b/i,
    ],
    linkedinUrl: [
        /\blinked[\s_-]?in\b/i,
    ],
    portfolioUrl: [
        /\bportfolio\b/i,
        /\bwebsite\b/i,
        /\bpersonal[\s_-]?site\b/i,
        /\bpersonal[\s_-]?website\b/i,
    ],
    githubUrl: [
        /\bgithub\b/i,
    ],
    coverLetter: [
        /\bcover[\s_-]?letter\b/i,
        /\bmotivation\b/i,
        /\bwhy[\s_-]?us\b/i,
        /\bstatement\b/i,
    ],
    workHistory: [
        /\bwork[\s_-]?history\b/i,
        /\bemployment[\s_-]?history\b/i,
        /\bexperience[\s_-]?details\b/i,
        /\bprofessional[\s_-]?summary\b/i,
    ],
};

export interface FormField {
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    type: string;
    name: string;
    id: string;
    placeholder: string;
    label: string;
    ariaLabel: string;
    surroundingText?: string;
    sectionTitle?: string;
}

/**
 * Advanced label detection that mimics browser accessibility tree logic
 */
export function getComputedLabel(field: HTMLElement): string {
    // 1. Explicit Label (for="id")
    if (field.id) {
        const labelEl = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
        if (labelEl && labelEl.textContent?.trim()) {
            return labelEl.textContent.trim();
        }
    }

    // 2. Wrapped Label (<label><input /></label>)
    const parentLabel = field.closest('label');
    if (parentLabel) {
        // Clone and remove the input itself to get just the text
        const clone = parentLabel.cloneNode(true) as HTMLElement;
        const inputInClone = clone.querySelector('input, select, textarea');
        if (inputInClone) inputInClone.remove();
        if (clone.textContent?.trim()) return clone.textContent.trim();
    }

    // 3. Aria Label
    const ariaLabel = field.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    // 4. Aria LabelledBy
    const ariaLabelledBy = field.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
        const ids = ariaLabelledBy.split(' ');
        const texts = ids.map(id => document.getElementById(id)?.textContent?.trim()).filter(Boolean);
        if (texts.length > 0) return texts.join(' ');
    }

    // 5. Placeholder (weak signal, but useful)
    if ((field as HTMLInputElement).placeholder) {
        return (field as HTMLInputElement).placeholder;
    }

    // 6. Heuristic: Preceding Text Node (common in table layouts or bad forms)
    // Look at previous sibling or previous element
    let prev = field.previousSibling;
    while (prev) {
        if (prev.nodeType === Node.TEXT_NODE && prev.textContent?.trim()) {
            return prev.textContent.trim();
        }
        if (prev.nodeType === Node.ELEMENT_NODE) {
            // If it's a label or span or div with text
            if (prev.textContent?.trim() && (prev as HTMLElement).tagName !== 'INPUT') {
                return prev.textContent.trim();
            }
        }
        prev = prev.previousSibling;
    }

    // 7. Heuristic: Parent container text (if mostly empty otherwise)
    const parent = field.parentElement;
    if (parent) {
        const clone = parent.cloneNode(true) as HTMLElement;
        const inputInClone = clone.querySelector('input, select, textarea');
        if (inputInClone) inputInClone.remove();
        // Remove other common noise
        const icons = clone.querySelectorAll('svg, i, .icon');
        icons.forEach(i => i.remove());
        
        const text = clone.textContent?.trim();
        if (text && text.length < 100) return text;
    }

    // 8. Heuristic: Table Row (Cell 1 = Label, Cell 2 = Input)
    const td = field.closest('td');
    if (td) {
        const tr = td.parentElement;
        if (tr) {
            const cells = Array.from(tr.children);
            const myIndex = cells.indexOf(td);
            if (myIndex > 0) {
                const labelCell = cells[myIndex - 1];
                if (labelCell.textContent?.trim()) return labelCell.textContent.trim();
            }
        }
    }

    return '';
}

/**
 * Recursively finds all form fields, piercing Shadow DOM
 */
export function getAllFillableElements(root: Document | ShadowRoot | HTMLElement = document): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] {
    const elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
    
    // Get standard inputs in this scope
    const inputs = root.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        elements.push(el as any);
    });

    // Recursively check all elements for shadow roots
    const allNodes = root.querySelectorAll('*');
    allNodes.forEach(node => {
        if (node.shadowRoot) {
            elements.push(...getAllFillableElements(node.shadowRoot));
        }
        // Also handle iFrames if we are in the main document context and can access them
        // Note: Cross-origin iframes will be handled by the 'all_frames': true in manifest
        // This is just for same-origin iframes that might not trigger a separate content script
        if (node.tagName === 'IFRAME') {
            try {
                const iframeDoc = (node as HTMLIFrameElement).contentDocument;
                if (iframeDoc) {
                    elements.push(...getAllFillableElements(iframeDoc));
                }
            } catch (e) {
                // Cross-origin, skip
            }
        }
    });

    return elements.filter(el => {
        // Filter out hidden/disabled/read-only
        if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'image') return false;
        if (el.disabled || el.readOnly) return false;
        // Check visibility
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        return true;
    });
}

export function getFieldMetadata(field: HTMLElement): FormField | null {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
        return null;
    }

    const label = getComputedLabel(field);
    
    // Get surrounding text (context)
    let surroundingText = '';
    const parent = field.closest('div, section, fieldset, li');
    if (parent) {
        const text = parent.textContent || '';
        if (text.length < 200) surroundingText = text.replace(label, '').trim();
    }

    // Get Section Title
    let sectionTitle = '';
    const section = field.closest('fieldset, section, [class*="section"]');
    if (section) {
        const header = section.querySelector('legend, h1, h2, h3, h4');
        if (header) sectionTitle = header.textContent?.trim() || '';
    }

    return {
        element: field,
        type: field.type || '',
        name: field.name || '',
        id: field.id || '',
        placeholder: field.placeholder || '',
        label,
        ariaLabel: field.getAttribute('aria-label') || '',
        surroundingText,
        sectionTitle
    };
}

export function detectFieldType(fieldMeta: FormField): string | null {
    const searchText = `${fieldMeta.name} ${fieldMeta.id} ${fieldMeta.placeholder} ${fieldMeta.label} ${fieldMeta.ariaLabel} ${fieldMeta.sectionTitle}`.toLowerCase();

    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(searchText)) {
                return fieldType;
            }
        }
    }

    return null;
}

export function mapFormFields(form: HTMLFormElement | HTMLElement): Map<string, FormField> {
    const fieldMap = new Map<string, FormField>();

    // Use our advanced walker if it's a generic container, otherwise query form
    let inputs: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
    
    if (form.shadowRoot) {
        inputs = getAllFillableElements(form.shadowRoot);
    } else {
        inputs = getAllFillableElements(form);
    }

    inputs.forEach((field) => {
        const fieldMeta = getFieldMetadata(field);
        if (!fieldMeta) return;

        const fieldType = detectFieldType(fieldMeta);
        if (fieldType) {
            fieldMap.set(fieldType, fieldMeta);
        }
    });

    return fieldMap;
}

export async function fillField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: any) {
    if (!value) return;

    try {
        // Ensure element is visible and interactive
        field.scrollIntoView({ behavior: 'auto', block: 'center' });
        field.focus();
        field.click(); // Important for some React components to "wake up"

        // Handle Select Elements
        if (field instanceof HTMLSelectElement) {
            const options = Array.from(field.options);
            let matched = options.find(opt => opt.value === String(value));
            
            // Try text match (exact)
            if (!matched) matched = options.find(opt => opt.text.toLowerCase() === String(value).toLowerCase());
            
            // Try fuzzy match
            if (!matched) matched = options.find(opt => opt.text.toLowerCase().includes(String(value).toLowerCase()));
            
            if (matched) {
                field.value = matched.value;
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.dispatchEvent(new Event('input', { bubbles: true }));
            }
            return;
        }

        // Handle Radio Buttons
        if (field.type === 'radio') {
            if (field.value === String(value) || (field.parentElement?.textContent?.trim().toLowerCase() === String(value).toLowerCase())) {
                field.checked = true;
                field.dispatchEvent(new Event('change', { bubbles: true }));
                field.click();
            }
            return;
        }

        // Handle Checkboxes
        if (field.type === 'checkbox') {
            const shouldCheck = Boolean(value);
            if (field.checked !== shouldCheck) {
                field.click(); // Better than setting .checked for React
            }
            return;
        }

        // Handle Text Inputs (and Textareas)
        const valueToSet = String(value);
        
        // Check for Combobox / Autocomplete
        const isCombobox = field.getAttribute('role') === 'combobox' || field.getAttribute('aria-autocomplete') === 'list';
        
        // Set value using native setter hack (bypasses React overrides)
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;
        
        const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (field instanceof HTMLInputElement && nativeInputValueSetter) {
            nativeInputValueSetter.call(field, valueToSet);
        } else if (field instanceof HTMLTextAreaElement && nativeTextareaValueSetter) {
            nativeTextareaValueSetter.call(field, valueToSet);
        } else {
            field.value = valueToSet;
        }

        // Dispatch comprehensive event sequence
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Special handling for search/combobox inputs (like Country/Phone code)
        if (isCombobox) {
            // Type a few keys to trigger search
            field.dispatchEvent(new KeyboardEvent('keydown', { key: valueToSet[0], bubbles: true }));
            field.dispatchEvent(new KeyboardEvent('keypress', { key: valueToSet[0], bubbles: true }));
            field.dispatchEvent(new KeyboardEvent('keyup', { key: valueToSet[0], bubbles: true }));
            
            // Wait briefly then hit Enter
            await new Promise(r => setTimeout(r, 100));
            field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
            field.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', bubbles: true }));
        }

        field.blur();

    } catch (error) {
        console.error('[Simplify-for-India] Error filling field:', error);
    }
}

export function calculateTotalExperience(employmentHistory: any[]): number {
    if (!employmentHistory || employmentHistory.length === 0) return 0;

    let totalMonths = 0;
    const now = new Date();

    for (const job of employmentHistory) {
        if (!job.startDate) continue;

        const start = new Date(job.startDate);
        const end = job.current ? now : (job.endDate ? new Date(job.endDate) : now);

        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += months;
    }

    return Math.round(totalMonths / 12 * 10) / 10;
}