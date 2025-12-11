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
    ],
    currentCtc: [
        /\b(current|present|existing)[\s_-]?(ctc|salary|compensation|package)\b/i,
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
}

export function getFieldMetadata(field: HTMLElement): FormField | null {
    if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) {
        return null;
    }

    // Get label text
    let label = '';
    if (field.id) {
        const labelEl = document.querySelector(`label[for="${field.id}"]`);
        if (labelEl) {
            label = labelEl.textContent?.trim() || '';
        }
    }

    // If no label, look for nearby label
    if (!label) {
        const parent = field.closest('div, td, li');
        if (parent) {
            const labelEl = parent.querySelector('label');
            if (labelEl) {
                label = labelEl.textContent?.trim() || '';
            }
        }
    }

    return {
        element: field,
        type: field.type || '',
        name: field.name || '',
        id: field.id || '',
        placeholder: field.placeholder || '',
        label,
        ariaLabel: field.getAttribute('aria-label') || '',
    };
}

export function detectFieldType(fieldMeta: FormField): string | null {
    const searchText = `${fieldMeta.name} ${fieldMeta.id} ${fieldMeta.placeholder} ${fieldMeta.label} ${fieldMeta.ariaLabel}`.toLowerCase();

    for (const [fieldType, patterns] of Object.entries(FIELD_PATTERNS)) {
        for (const pattern of patterns) {
            if (pattern.test(searchText)) {
                return fieldType;
            }
        }
    }

    return null;
}

export function mapFormFields(form: HTMLFormElement): Map<string, FormField> {
    const fieldMap = new Map<string, FormField>();

    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach((field) => {
        if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
            // Skip hidden, submit, button fields
            if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button' || field.type === 'image') {
                return;
            }

            const fieldMeta = getFieldMetadata(field);
            if (!fieldMeta) return;

            const fieldType = detectFieldType(fieldMeta);
            if (fieldType) {
                fieldMap.set(fieldType, fieldMeta);
            }
        }
    });

    return fieldMap;
}

export function fillField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: any) {
    if (!value) return;

    try {
        // Check if field is visible and not disabled
        if (field.offsetParent === null || field.disabled || field.readOnly) {
            return;
        }

        // Trigger focus
        field.focus();

        // Set the value
        if (field instanceof HTMLSelectElement) {
            // For select elements, find matching option
            const options = Array.from(field.options);
            const matchingOption = options.find(opt =>
                opt.value.toLowerCase().includes(value.toLowerCase()) ||
                opt.text.toLowerCase().includes(value.toLowerCase())
            );
            if (matchingOption) {
                field.value = matchingOption.value;
            }
        } else {
            // For input/textarea, respect maxlength
            let valueToSet = String(value);
            if (field.maxLength && field.maxLength > 0) {
                valueToSet = valueToSet.substring(0, field.maxLength);
            }
            field.value = valueToSet;
        }

        // Trigger events that frameworks listen to
        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        field.dispatchEvent(new Event('blur', { bubbles: true }));

        // Also trigger React synthetic events
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(field, field.value);
            field.dispatchEvent(new Event('input', { bubbles: true }));
        }
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

    return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal place
}
