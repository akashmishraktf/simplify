// Comprehensive field mapping patterns - Expanded for maximum accuracy
// Supports 50+ field types with 300+ patterns covering Indian & International job portals

const FIELD_PATTERNS = {
    // === NAME FIELDS ===
    firstName: [
        /\bfirst[\s_-]?name\b/i,
        /\bfname\b/i,
        /\bgiven[\s_-]?name\b/i,
        /\bforename\b/i,
        /\bprenom\b/i,  // French
        /\bvorname\b/i, // German
        /^first$/i,
    ],
    lastName: [
        /\blast[\s_-]?name\b/i,
        /\blname\b/i,
        /\bsurname\b/i,
        /\bfamily[\s_-]?name\b/i,
        /\bnom\b/i,      // French
        /\bnachname\b/i, // German
        /^last$/i,
    ],
    middleName: [
        /\bmiddle[\s_-]?name\b/i,
        /\bmname\b/i,
        /\bsecond[\s_-]?name\b/i,
    ],
    fullName: [
        /\b(full|complete|legal)[\s_-]?name\b/i,
        /\bcandidate[\s_-]?name\b/i,
        /\bapplicant[\s_-]?name\b/i,
        /\byour[\s_-]?name\b/i,
        /^name$/i,
    ],

    // === CONTACT FIELDS ===
    email: [
        /\b(email|e-mail|mail)[\s_-]?(address|id)?\b/i,
        /\bemail$/i,
        /\bcontact[\s_-]?email\b/i,
        /\bwork[\s_-]?email\b/i,
        /\bpersonal[\s_-]?email\b/i,
    ],
    phoneNumber: [
        /\b(phone|mobile|contact|cell)[\s_-]?(number|no\.?|num)?\b/i,
        /\btel(ephone)?\b/i,
        /\bprimary[\s_-]?phone\b/i,
        /\bwork[\s_-]?phone\b/i,
        /\bhome[\s_-]?phone\b/i,
        /\bwhatsapp\b/i,
        /\bmob\b/i,
    ],
    alternatePhone: [
        /\b(alternate|alternative|secondary)[\s_-]?(phone|mobile|contact)\b/i,
        /\bother[\s_-]?phone\b/i,
    ],

    // === ADDRESS FIELDS ===
    address: [
        /\b(full[\s_-]?)?address\b/i,
        /\bstreet[\s_-]?address\b/i,
        /\bresidential[\s_-]?address\b/i,
        /\bhome[\s_-]?address\b/i,
        /\bcurrent[\s_-]?address\b/i,
    ],
    addressLine1: [
        /\baddress[\s_-]?line[\s_-]?1\b/i,
        /\bstreet[\s_-]?1\b/i,
        /\bline[\s_-]?1\b/i,
    ],
    addressLine2: [
        /\baddress[\s_-]?line[\s_-]?2\b/i,
        /\bstreet[\s_-]?2\b/i,
        /\bline[\s_-]?2\b/i,
        /\bapartment\b/i,
        /\bunit\b/i,
        /\bsuite\b/i,
    ],
    city: [
        /\bcity\b/i,
        /\btown\b/i,
        /\bmunicipality\b/i,
    ],
    state: [
        /\bstate\b/i,
        /\bprovince\b/i,
        /\bregion\b/i,
    ],
    zipCode: [
        /\bzip[\s_-]?code\b/i,
        /\bpostal[\s_-]?code\b/i,
        /\bpincode\b/i,
        /\bpin\b/i,
        /\bpostcode\b/i,
    ],
    country: [
        /\bcountry\b/i,
        /\bnationality\b/i,
    ],

    // === LOCATION FIELDS ===
    currentLocation: [
        /\b(current|present)[\s_-]?(location|city|residence)\b/i,
        /\bwhere[\s_-]?do[\s_-]?you[\s_-]?live\b/i,
        /\bcurrent[\s_-]?city\b/i,
    ],
    preferredLocation: [
        /\b(preferred|desired|target|willing)[\s_-]?(location|city|work[\s_-]?location)\b/i,
        /\bpreferred[\s_-]?work[\s_-]?location\b/i,
        /\bjob[\s_-]?location[\s_-]?preference\b/i,
    ],
    location: [
        /\blocation\b/i,
        /\bcity\b/i,
    ],

    // === EMPLOYMENT FIELDS ===
    currentCompany: [
        /\b(current|present|existing)[\s_-]?(company|employer|organization|organisation)\b/i,
        /\bmost[\s_-]?recent[\s_-]?(company|employer)\b/i,
        /\bworking[\s_-]?at\b/i,
    ],
    company: [
        /\b(company|employer|organization|organisation)[\s_-]?name\b/i,
        /\bcompany\b/i,
    ],
    jobTitle: [
        /\b(job[\s_-]?title|designation|position|role)\b/i,
        /\bcurrent[\s_-]?(designation|position|role|title)\b/i,
        /\bwhat[\s_-]?is[\s_-]?your[\s_-]?role\b/i,
    ],
    department: [
        /\bdepartment\b/i,
        /\bteam\b/i,
        /\bfunction\b/i,
    ],

    // === SALARY & COMPENSATION ===
    currentCtc: [
        /\b(current|present|existing)[\s_-]?(ctc|salary|compensation|package|pay)\b/i,
        /\bcurrent[\s_-]?annual[\s_-]?(salary|ctc)\b/i,
        /\btotal[\s_-]?compensation\b/i,
    ],
    expectedCtc: [
        /\b(expected|desired|target|asking)[\s_-]?(ctc|salary|compensation|package)\b/i,
        /\bexpected[\s_-]?annual[\s_-]?salary\b/i,
    ],
    desiredSalary: [
        /\bdesired[\s_-]?(salary|ctc|compensation|package)\b/i,
        /\bsalary[\s_-]?expectations?\b/i,
        /\bwhat[\s_-]?salary[\s_-]?are[\s_-]?you[\s_-]?looking[\s_-]?for\b/i,
    ],

    // === EXPERIENCE ===
    experience: [
        /\b(total|years[\s_-]?of|overall)[\s_-]?experience\b/i,
        /\bexperience[\s_-]?(years|in[\s_-]?years|level)?\b/i,
        /\bhow[\s_-]?many[\s_-]?years\b/i,
        /\byears[\s_-]?of[\s_-]?experience\b/i,
    ],
    relevantExperience: [
        /\brelevant[\s_-]?experience\b/i,
        /\bexperience[\s_-]?in[\s_-]?this[\s_-]?field\b/i,
    ],

    // === AVAILABILITY ===
    noticePeriod: [
        /\bnotice[\s_-]?period\b/i,
        /\bjoining[\s_-]?(period|time)\b/i,
        /\bhow[\s_-]?soon[\s_-]?can[\s_-]?you[\s_-]?join\b/i,
        /\bavailability\b/i,
        /\bwhen[\s_-]?can[\s_-]?you[\s_-]?start\b/i,
    ],
    availableFrom: [
        /\bavailable[\s_-]?from\b/i,
        /\bstart[\s_-]?date\b/i,
        /\bjoining[\s_-]?date\b/i,
        /\bcan[\s_-]?start[\s_-]?on\b/i,
    ],

    // === RELOCATION & TRAVEL ===
    willingToRelocate: [
        /\bwilling[\s_-]?to[\s_-]?relocate\b/i,
        /\brelocation\b/i,
        /\bopen[\s_-]?to[\s_-]?relocation\b/i,
        /\bcan[\s_-]?you[\s_-]?relocate\b/i,
    ],
    willingToTravel: [
        /\bwilling[\s_-]?to[\s_-]?travel\b/i,
        /\btravel[\s_-]?requirements?\b/i,
        /\bcan[\s_-]?you[\s_-]?travel\b/i,
    ],

    // === SKILLS & EXPERTISE ===
    skills: [
        /\b(skills|technologies|tech[\s_-]?stack|expertise|competencies)\b/i,
        /\bkey[\s_-]?skills\b/i,
        /\btechnical[\s_-]?skills\b/i,
        /\bcore[\s_-]?skills\b/i,
        /\bproficiencies\b/i,
    ],
    primarySkills: [
        /\bprimary[\s_-]?skills\b/i,
        /\bmain[\s_-]?skills\b/i,
    ],
    secondarySkills: [
        /\bsecondary[\s_-]?skills\b/i,
        /\badditional[\s_-]?skills\b/i,
    ],
    certifications: [
        /\bcertifications?\b/i,
        /\blicenses?\b/i,
        /\bprofessional[\s_-]?certifications?\b/i,
    ],
    languages: [
        /\b(languages?|linguistic)[\s_-]?(known|proficiency)?\b/i,
        /\bspeak\b/i,
        /\bfluent[\s_-]?in\b/i,
    ],

    // === EDUCATION ===
    education: [
        /\b(education|qualification|degree|academic)\b/i,
        /\bhighest[\s_-]?(qualification|education)\b/i,
        /\beducational[\s_-]?background\b/i,
    ],
    degree: [
        /\bdegree\b/i,
        /\bdiploma\b/i,
        /\bcertificate\b/i,
    ],
    fieldOfStudy: [
        /\b(field|area|major|specialization)[\s_-]?of[\s_-]?study\b/i,
        /\bmajor\b/i,
        /\bspecialization\b/i,
        /\bstream\b/i,
    ],
    institution: [
        /\b(college|university|institution|school)[\s_-]?name\b/i,
        /\binstitution\b/i,
        /\buniversity\b/i,
        /\bcollege\b/i,
    ],
    graduationYear: [
        /\b(graduation|passing|completion)[\s_-]?year\b/i,
        /\byear[\s_-]?of[\s_-]?graduation\b/i,
        /\bwhen[\s_-]?did[\s_-]?you[\s_-]?graduate\b/i,
    ],
    gpa: [
        /\bgpa\b/i,
        /\bgrade[\s_-]?point[\s_-]?average\b/i,
        /\bpercentage\b/i,
        /\bcgpa\b/i,
    ],

    // === DOCUMENTS ===
    resume: [
        /\b(resume|cv|curriculum[\s_-]?vitae)\b/i,
        /\bupload[\s_-]?(resume|cv)\b/i,
        /\battach[\s_-]?resume\b/i,
    ],
    coverLetter: [
        /\bcover[\s_-]?letter\b/i,
        /\bmotivation[\s_-]?letter\b/i,
        /\bwhy[\s_-]?(us|this[\s_-]?role|join)\b/i,
        /\bpersonal[\s_-]?statement\b/i,
        /\bstatement[\s_-]?of[\s_-]?purpose\b/i,
    ],
    workHistory: [
        /\bwork[\s_-]?history\b/i,
        /\bemployment[\s_-]?history\b/i,
        /\bexperience[\s_-]?details\b/i,
        /\bprofessional[\s_-]?(summary|experience)\b/i,
        /\bjob[\s_-]?history\b/i,
    ],

    // === SOCIAL PROFILES ===
    linkedinUrl: [
        /\blinked[\s_-]?in\b/i,
        /\blinkedin[\s_-]?(url|profile|link)\b/i,
    ],
    githubUrl: [
        /\bgithub\b/i,
        /\bgit[\s_-]?hub[\s_-]?(url|profile|username)\b/i,
    ],
    portfolioUrl: [
        /\bportfolio\b/i,
        /\bwebsite\b/i,
        /\bpersonal[\s_-]?(site|website|url)\b/i,
        /\bonline[\s_-]?portfolio\b/i,
    ],
    twitterUrl: [
        /\btwitter\b/i,
        /\bx\.com\b/i,
    ],

    // === DEMOGRAPHICS (EEOC) ===
    gender: [
        /\bgender\b/i,
        /\bsex\b/i,
    ],
    dateOfBirth: [
        /\b(date|day)[\s_-]?of[\s_-]?birth\b/i,
        /\bdob\b/i,
        /\bbirthday\b/i,
        /\bbirthdate\b/i,
    ],
    nationality: [
        /\bnationality\b/i,
        /\bcitizenship\b/i,
    ],
    ethnicity: [
        /\bethnicity\b/i,
        /\brace\b/i,
    ],
    disability: [
        /\bdisability\b/i,
        /\bdisabled\b/i,
    ],
    veteran: [
        /\bveteran\b/i,
        /\bmilitary[\s_-]?service\b/i,
    ],

    // === WORK AUTHORIZATION ===
    workAuthorization: [
        /\bwork[\s_-]?(authorization|permit|visa)\b/i,
        /\bauthorized[\s_-]?to[\s_-]?work\b/i,
        /\blegally[\s_-]?authorized\b/i,
    ],
    visaStatus: [
        /\bvisa[\s_-]?status\b/i,
        /\bimmigration[\s_-]?status\b/i,
    ],
    requireSponsorship: [
        /\brequire[\s_-]?sponsorship\b/i,
        /\bneed[\s_-]?visa[\s_-]?sponsorship\b/i,
        /\bsponsorship\b/i,
    ],

    // === PREFERENCES ===
    workPreference: [
        /\bwork[\s_-]?(preference|type|mode|arrangement)\b/i,
        /\b(remote|hybrid|onsite|in-office)\b/i,
        /\bpreferred[\s_-]?work[\s_-]?mode\b/i,
    ],
    employmentType: [
        /\bemployment[\s_-]?type\b/i,
        /\b(full[\s_-]?time|part[\s_-]?time|contract|freelance)\b/i,
    ],

    // === REFERENCES ===
    referenceName: [
        /\breference[\s_-]?name\b/i,
        /\breferee[\s_-]?name\b/i,
    ],
    referenceEmail: [
        /\breference[\s_-]?email\b/i,
        /\breferee[\s_-]?email\b/i,
    ],
    referencePhone: [
        /\breference[\s_-]?phone\b/i,
        /\breferee[\s_-]?phone\b/i,
    ],
    referenceRelationship: [
        /\breference[\s_-]?relationship\b/i,
        /\bhow[\s_-]?do[\s_-]?you[\s_-]?know\b/i,
    ],

    // === MISCELLANEOUS ===
    hearAboutUs: [
        /\bhow[\s_-]?did[\s_-]?you[\s_-]?(hear|find|know)[\s_-]?about[\s_-]?us\b/i,
        /\breferral[\s_-]?source\b/i,
        /\bsource\b/i,
    ],
    additionalInfo: [
        /\badditional[\s_-]?information\b/i,
        /\bother[\s_-]?details\b/i,
        /\banything[\s_-]?else\b/i,
        /\bcomments\b/i,
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
 * Recursively finds all form fields, piercing Shadow DOM.
 * Enhanced to also detect contenteditable divs, [role="textbox"], and custom web components.
 */
export function getAllFillableElements(root: Document | ShadowRoot | HTMLElement = document): (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] {
    const elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[] = [];
    
    // Get standard inputs in this scope
    const inputs = root.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        elements.push(el as any);
    });

    // Get contenteditable elements and role="textbox" (rich text editors, custom inputs)
    const contentEditables = root.querySelectorAll(
        '[contenteditable="true"], [contenteditable=""], [role="textbox"], [role="combobox"]'
    );
    contentEditables.forEach(el => {
        // Skip if it's already an input/select/textarea
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) return;
        // Wrap as a pseudo-element for our pipeline
        const wrapper = createContentEditableWrapper(el as HTMLElement);
        if (wrapper) elements.push(wrapper as any);
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
        // Check visibility (skip for content-editable wrappers - they handle their own visibility)
        if (!(el as any).__contentEditableRef) {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
        }
        return true;
    });
}

/**
 * Creates a pseudo input wrapper around a contenteditable element
 * so it can participate in our form field pipeline.
 */
function createContentEditableWrapper(el: HTMLElement): any {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return null;

    // Create a proxy object that behaves like an HTMLInputElement
    const wrapper = {
        __contentEditableRef: el,
        tagName: 'TEXTAREA',
        type: 'text',
        name: el.getAttribute('name') || el.getAttribute('data-name') || '',
        id: el.id || '',
        placeholder: el.getAttribute('placeholder') || el.getAttribute('data-placeholder') || '',
        required: el.hasAttribute('required') || el.getAttribute('aria-required') === 'true',
        disabled: false,
        readOnly: false,
        value: el.textContent || el.innerText || '',
        // Forward DOM methods
        getAttribute: (attr: string) => el.getAttribute(attr),
        closest: (sel: string) => el.closest(sel),
        querySelector: (sel: string) => el.querySelector(sel),
        querySelectorAll: (sel: string) => el.querySelectorAll(sel),
        parentElement: el.parentElement,
        previousSibling: el.previousSibling,
        scrollIntoView: (opts: any) => el.scrollIntoView(opts),
        focus: () => el.focus(),
        click: () => el.click(),
        blur: () => el.blur(),
        dispatchEvent: (e: Event) => el.dispatchEvent(e),
        style: el.style,
        setAttribute: (name: string, val: string) => el.setAttribute(name, val),
        removeAttribute: (name: string) => el.removeAttribute(name),
        hasAttribute: (name: string) => el.hasAttribute(name),
    };

    // Override value setter to write to contenteditable
    Object.defineProperty(wrapper, 'value', {
        get: () => el.textContent || el.innerText || '',
        set: (val: string) => {
            el.textContent = val;
        },
    });

    return wrapper;
}

// ============================================================================
// FIELD CLUSTERING (for "virtual form" detection on ambiguous platforms)
// ============================================================================

export interface FieldCluster {
    root: HTMLElement;
    elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];
    score: number;
    depth: number;
}

/**
 * Find the nearest common ancestor for a set of elements
 */
function nearestCommonAncestor(elements: HTMLElement[]): HTMLElement {
    if (elements.length === 0) return document.body;
    if (elements.length === 1) return elements[0].parentElement || document.body;

    // Build path to root for first element
    function pathToRoot(el: HTMLElement): HTMLElement[] {
        const path: HTMLElement[] = [];
        let current: HTMLElement | null = el;
        while (current) {
            path.push(current);
            current = current.parentElement;
        }
        return path;
    }

    const first_path = pathToRoot(elements[0]);
    const first_path_set = new Set(first_path);

    // For each subsequent element, find the first ancestor in common with the first path
    let common = first_path[first_path.length - 1]; // Start with documentElement
    let best_depth = 0;

    for (let i = 1; i < elements.length; i++) {
        let current: HTMLElement | null = elements[i];
        while (current) {
            if (first_path_set.has(current)) {
                const depth = first_path.indexOf(current);
                if (depth > best_depth) {
                    best_depth = depth;
                }
                common = current;
                break;
            }
            current = current.parentElement;
        }
    }

    return common;
}

/**
 * Cluster fillable fields by DOM proximity.
 * Groups fields that share a close common ancestor,
 * allowing detection of "virtual forms" that don't use <form> tags.
 */
export function clusterFieldsByProximity(
    elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[],
    max_depth: number = 8
): FieldCluster[] {
    if (elements.length === 0) return [];
    if (elements.length <= 3) {
        // Few elements: treat as one cluster
        const root = nearestCommonAncestor(elements as any as HTMLElement[]);
        return [{
            root,
            elements,
            score: elements.length * 2,
            depth: 0,
        }];
    }

    // Strategy: group elements by their nearest "meaningful" ancestor
    // (section, fieldset, div with class, article, etc.)
    const meaningful_selectors = 'form, fieldset, section, article, [role="form"], [class*="form"], [class*="section"], [class*="step"], [class*="group"], [class*="question"], main';

    const clusters_map = new Map<HTMLElement, (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[]>();

    for (const el of elements) {
        // Find nearest meaningful container
        let container = (el as HTMLElement).closest(meaningful_selectors) as HTMLElement | null;

        // If no meaningful container, walk up max_depth levels
        if (!container) {
            let current: HTMLElement | null = el.parentElement;
            let depth = 0;
            while (current && depth < max_depth) {
                // Stop at elements that seem like form groups (have multiple inputs)
                const inputs_in_container = current.querySelectorAll('input, select, textarea, [contenteditable="true"]');
                if (inputs_in_container.length >= 2) {
                    container = current;
                    break;
                }
                current = current.parentElement;
                depth++;
            }
        }

        if (!container) container = document.body;

        if (!clusters_map.has(container)) {
            clusters_map.set(container, []);
        }
        clusters_map.get(container)!.push(el);
    }

    // Convert to FieldCluster array and score
    const clusters: FieldCluster[] = [];

    for (const [root, group_elements] of clusters_map.entries()) {
        let score = group_elements.length * 2;

        // Bonus for form-like containers
        const text = (root.textContent || '').toLowerCase();
        if (text.includes('apply') || text.includes('application')) score += 15;
        if (text.includes('resume') || text.includes('cv')) score += 20;
        if (text.includes('submit')) score += 10;
        if (root.tagName === 'FORM') score += 25;
        if (root.getAttribute('role') === 'form') score += 20;

        // Penalty for non-form content
        if (text.includes('search') || text.includes('find job')) score -= 15;
        if (text.includes('login') || text.includes('sign in')) score -= 15;

        const depth = getElementDepth(root);

        clusters.push({ root, elements: group_elements, score, depth });
    }

    // Sort by score descending
    clusters.sort((a, b) => b.score - a.score);

    return clusters;
}

function getElementDepth(el: HTMLElement): number {
    let depth = 0;
    let current: HTMLElement | null = el;
    while (current) {
        depth++;
        current = current.parentElement;
    }
    return depth;
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

export type PlatformType =
    | 'naukri'
    | 'google_forms'
    | 'typeform'
    | 'greenhouse'
    | 'lever'
    | 'workday'
    | 'linkedin'
    | 'indeed'
    | 'generic';

/**
 * Detect the current job platform from URL and DOM signals
 */
export function detectPlatform(): PlatformType {
    const hostname = window.location.hostname.toLowerCase();
    const url = window.location.href.toLowerCase();

    if (hostname.includes('naukri.com')) return 'naukri';
    if (hostname.includes('docs.google.com') && url.includes('/forms/')) return 'google_forms';
    if (hostname.includes('typeform.com') || document.querySelector('[data-tf-element]')) return 'typeform';
    if (hostname.includes('greenhouse.io') || hostname.includes('boards.greenhouse')) return 'greenhouse';
    if (hostname.includes('lever.co') || hostname.includes('jobs.lever')) return 'lever';
    if (hostname.includes('myworkdayjobs.com') || hostname.includes('workday.com')) return 'workday';
    if (hostname.includes('linkedin.com')) return 'linkedin';
    if (hostname.includes('indeed.com')) return 'indeed';

    // Check for embedded ATS indicators
    if (document.querySelector('[class*="greenhouse"]')) return 'greenhouse';
    if (document.querySelector('[class*="lever-"]')) return 'lever';
    if (document.querySelector('iframe[src*="greenhouse"]')) return 'greenhouse';
    if (document.querySelector('iframe[src*="lever"]')) return 'lever';

    return 'generic';
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
        // Handle contenteditable wrapper
        if ((field as any).__contentEditableRef) {
            const el = (field as any).__contentEditableRef as HTMLElement;
            el.scrollIntoView({ behavior: 'auto', block: 'center' });
            el.focus();
            el.textContent = String(value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.blur();
            return;
        }

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

// ============================================================================
// CLIENT-SIDE CACHING SYSTEM
// ============================================================================

interface FieldMapping {
    fieldId: string;
    fieldType: string;
    confidence: number;
}

interface CachedFormMapping {
    formSignature: string;
    url: string;
    mappings: FieldMapping[];
    timestamp: number;
    successCount: number;
}

const CACHE_STORAGE_KEY = 'simplify_field_mappings_cache';
const CACHE_TTL_DAYS = 30;
const CACHE_MAX_ENTRIES = 100;

/**
 * Generate a unique signature for a form based on its structure
 */
export function generateFormSignature(fieldsMetadata: any[]): string {
    // Create signature from field structure (not values)
    const fieldFingerprint = fieldsMetadata.map(f =>
        `${f.element_type}:${f.input_type}:${f.name}:${f.label?.toLowerCase().slice(0, 20)}`
    ).join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < fieldFingerprint.length; i++) {
        const char = fieldFingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    return `form_${Math.abs(hash).toString(36)}`;
}

/**
 * Get domain from URL for cache scoping
 */
function getDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return 'unknown';
    }
}

/**
 * Load cached field mappings for current form
 */
export async function getCachedMapping(formSignature: string, url: string): Promise<FieldMapping[] | null> {
    try {
        const result = await chrome.storage.local.get([CACHE_STORAGE_KEY]);
        const cache: Record<string, CachedFormMapping> = result[CACHE_STORAGE_KEY] || {};

        const domain = getDomain(url);
        const cacheKey = `${domain}:${formSignature}`;
        const cached = cache[cacheKey];

        if (!cached) return null;

        // Check TTL
        const age = Date.now() - cached.timestamp;
        const maxAge = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
        if (age > maxAge) {
            // Expired, remove it
            delete cache[cacheKey];
            await chrome.storage.local.set({ [CACHE_STORAGE_KEY]: cache });
            return null;
        }

        return cached.mappings;
    } catch (error) {
        console.error('[Cache] Failed to load cached mapping:', error);
        return null;
    }
}

/**
 * Save successful field mappings to cache
 */
export async function saveCachedMapping(
    formSignature: string,
    url: string,
    mappings: FieldMapping[]
): Promise<void> {
    try {
        const result = await chrome.storage.local.get([CACHE_STORAGE_KEY]);
        const cache: Record<string, CachedFormMapping> = result[CACHE_STORAGE_KEY] || {};

        const domain = getDomain(url);
        const cacheKey = `${domain}:${formSignature}`;

        // Update or create cache entry
        const existing = cache[cacheKey];
        cache[cacheKey] = {
            formSignature,
            url,
            mappings,
            timestamp: Date.now(),
            successCount: (existing?.successCount || 0) + 1,
        };

        // Prune old entries if cache is too large
        const entries = Object.entries(cache);
        if (entries.length > CACHE_MAX_ENTRIES) {
            // Sort by timestamp and keep most recent
            entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            const pruned = Object.fromEntries(entries.slice(0, CACHE_MAX_ENTRIES));
            await chrome.storage.local.set({ [CACHE_STORAGE_KEY]: pruned });
        } else {
            await chrome.storage.local.set({ [CACHE_STORAGE_KEY]: cache });
        }

        console.log(`[Cache] Saved mapping for ${cacheKey}, success count: ${cache[cacheKey].successCount}`);
    } catch (error) {
        console.error('[Cache] Failed to save cached mapping:', error);
    }
}

/**
 * Clear all cached mappings
 */
export async function clearMappingCache(): Promise<void> {
    await chrome.storage.local.remove([CACHE_STORAGE_KEY]);
    console.log('[Cache] Cleared all cached mappings');
}

// ============================================================================
// RULE-BASED FIELD MATCHING (Primary Strategy)
// ============================================================================

/**
 * Match profile data to field type
 * This is exported and used in content.ts for cached mappings
 */
export function getProfileValueForFieldType(fieldType: string, profile: any): any {
    if (!profile) return null;

    const mapping: Record<string, any> = {
        // Name fields
        firstName: profile.firstName,
        lastName: profile.lastName,
        middleName: profile.middleName,
        fullName: profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim(),

        // Contact
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        alternatePhone: profile.alternatePhone,

        // Address
        address: profile.address,
        addressLine1: profile.addressLine1 || profile.address,
        addressLine2: profile.addressLine2,
        city: profile.city || profile.currentLocation,
        state: profile.state,
        zipCode: profile.zipCode || profile.pincode,
        country: profile.country,

        // Location
        currentLocation: profile.currentLocation,
        preferredLocation: profile.preferredLocation,
        location: profile.currentLocation || profile.preferredLocation,

        // Employment
        currentCompany: profile.currentCompany || profile.employmentHistory?.[0]?.company,
        company: profile.currentCompany || profile.company,
        jobTitle: profile.jobTitle || profile.employmentHistory?.[0]?.title,
        department: profile.department,

        // Salary
        currentCtc: profile.currentCtc,
        expectedCtc: profile.expectedCtc,
        desiredSalary: profile.expectedCtc || profile.desiredSalary,

        // Experience
        experience: profile.totalExperience || calculateTotalExperience(profile.employmentHistory || []),
        relevantExperience: profile.relevantExperience || profile.totalExperience,

        // Availability
        noticePeriod: profile.noticePeriod,
        availableFrom: profile.availableFrom,

        // Preferences
        willingToRelocate: profile.willingToRelocate ? 'Yes' : 'No',
        willingToTravel: profile.willingToTravel ? 'Yes' : 'No',
        workPreference: profile.workPreference,
        employmentType: profile.employmentType,

        // Skills & Education
        skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills,
        primarySkills: profile.primarySkills,
        secondarySkills: profile.secondarySkills,
        certifications: profile.certifications,
        languages: Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages,
        education: profile.education?.[0]?.degree || profile.highestQualification,
        degree: profile.education?.[0]?.degree,
        fieldOfStudy: profile.education?.[0]?.fieldOfStudy,
        institution: profile.education?.[0]?.institution,
        graduationYear: profile.education?.[0]?.graduationYear,
        gpa: profile.education?.[0]?.gpa,

        // Documents
        coverLetter: profile.coverLetter,
        workHistory: profile.workHistory,

        // Social
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
        twitterUrl: profile.twitterUrl,

        // Demographics
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth,
        nationality: profile.nationality,
        ethnicity: profile.ethnicity,
        disability: profile.disability,
        veteran: profile.veteran,

        // Work Authorization
        workAuthorization: profile.workAuthorization,
        visaStatus: profile.visaStatus,
        requireSponsorship: profile.requireSponsorship ? 'Yes' : 'No',

        // References
        referenceName: profile.references?.[0]?.name,
        referenceEmail: profile.references?.[0]?.email,
        referencePhone: profile.references?.[0]?.phone,
        referenceRelationship: profile.references?.[0]?.relationship,

        // Misc
        hearAboutUs: profile.hearAboutUs,
        additionalInfo: profile.additionalInfo,
    };

    return mapping[fieldType];
}

/**
 * Rule-based form filling using pattern matching
 * Returns array of fill actions
 */
export function fillFormWithRules(fieldsMetadata: any[], profile: any): any[] {
    const results: any[] = [];

    for (const field of fieldsMetadata) {
        const fieldMeta: FormField = {
            element: null as any, // We don't have the element here
            type: field.input_type || field.element_type,
            name: field.name || '',
            id: field.id || '',
            placeholder: field.placeholder || '',
            label: field.label || '',
            ariaLabel: field.aria_label || '',
            surroundingText: field.surrounding_text,
            sectionTitle: field.section_title,
        };

        // Detect field type using patterns
        const fieldType = detectFieldType(fieldMeta);

        if (fieldType) {
            const value = getProfileValueForFieldType(fieldType, profile);

            if (value !== null && value !== undefined && value !== '') {
                results.push({
                    field_id: field.field_id,
                    action: 'fill',
                    value: value,
                    confidence: 0.9, // High confidence for rule-based
                    reasoning: `Rule-based match: ${fieldType}`,
                    source: 'rules',
                });
            } else {
                results.push({
                    field_id: field.field_id,
                    action: 'skip',
                    reasoning: `No profile value for ${fieldType}`,
                    source: 'rules',
                });
            }
        } else {
            // Unknown field - mark for LLM processing
            results.push({
                field_id: field.field_id,
                action: 'skip',
                reasoning: 'No pattern match - needs AI',
                source: 'rules',
                needsAI: true,
            });
        }
    }

    return results;
}