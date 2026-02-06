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
    getProfileValueForFieldType,
    clusterFieldsByProximity,
    detectPlatform,
    PlatformType,
} from './utils/fieldMapper';
import { scrapeJobDescription, scrapeCompanyName, scrapeJobTitle } from './utils/jdScraper';
import { getAdapter, PlatformAdapter } from './adapters';

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

// ========================================================================
// API Helpers (direct fetch for content script context)
// ========================================================================

const API_URL = 'http://localhost:3000';

async function getAuthHeaders(): Promise<Record<string, string>> {
    const result = await chrome.storage.local.get(['access_token', 'gemini_api_key']);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (result.access_token) {
        headers['Authorization'] = `Bearer ${result.access_token}`;
    }
    if (result.gemini_api_key) {
        headers['x-gemini-api-key'] = result.gemini_api_key;
    }
    return headers;
}

// Fetch user profile from storage
async function loadProfile() {
    try {
        const result = await chrome.storage.local.get(['access_token']);
        if (!result.access_token) {
            console.log('[Simplify-for-India] No access token found');
            return null;
        }

        const response = await fetch(`${API_URL}/v1/profile`, {
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

// ========================================================================
// Custom Question Detection
// ========================================================================

/**
 * Determines if a field is likely a "custom question" (open-ended text)
 * rather than a standard profile field.
 */
function isCustomQuestion(fieldMeta: any): boolean {
    // Must be a textarea or a long text input
    const is_text_area = fieldMeta.element_type === 'textarea';
    const is_long_text = fieldMeta.element_type === 'input' &&
        (fieldMeta.input_type === 'text' || fieldMeta.input_type === '') &&
        fieldMeta.label?.length > 30;

    if (!is_text_area && !is_long_text) return false;

    // Check if the label looks like a question
    const label = (fieldMeta.label || '').toLowerCase();
    const surrounding = (fieldMeta.surrounding_text || '').toLowerCase();
    const combined = `${label} ${surrounding}`;

    // Custom question indicators
    const question_patterns = [
        /why\s+(do\s+you|are\s+you|should\s+we|would\s+you)/i,
        /what\s+(is\s+your|are\s+your|makes\s+you|motivates)/i,
        /how\s+(do\s+you|would\s+you|have\s+you)/i,
        /describe\s+(a|an|your|the)/i,
        /tell\s+(us|me)\s+about/i,
        /explain\s+(why|how|your)/i,
        /share\s+(an?\s+example|your)/i,
        /what\s+.*\s+experience/i,
        /provide\s+(an?\s+example|details)/i,
        /\?\s*$/,  // Ends with a question mark
    ];

    for (const pattern of question_patterns) {
        if (pattern.test(combined)) return true;
    }

    // If it's a textarea with a long label that we couldn't match to a profile field
    if (is_text_area && label.length > 20) {
        // Check it's not a standard profile field (cover letter, work history, etc.)
        const standard_patterns = [
            /cover\s*letter/i, /work\s*history/i, /employment\s*history/i,
            /professional\s*summary/i, /skills/i, /address/i,
        ];
        const is_standard = standard_patterns.some(p => p.test(combined));
        if (!is_standard) return true;
    }

    return false;
}

// ========================================================================
// Inline Review Popup for AI-Generated Answers
// ========================================================================

function createInlineReviewPopup(
    element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    question_text: string,
    answer: string,
    confidence: number,
    source: string,
    onAccept: (final_answer: string, was_edited: boolean) => void,
    onReject: () => void,
    onSave: (question: string, answer: string, original_answer: string, was_edited: boolean) => void
): HTMLElement {
    const popup = document.createElement('div');
    popup.className = 'simplify-inline-review';
    popup.style.cssText = `
        position: absolute;
        z-index: 2147483646;
        background: #ffffff;
        border: 1px solid #c7d2fe;
        border-radius: 12px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        padding: 14px;
        max-width: 420px;
        min-width: 300px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        color: #1e293b;
    `;

    // Position near the element
    const rect = element.getBoundingClientRect();
    popup.style.top = `${window.scrollY + rect.bottom + 8}px`;
    popup.style.left = `${window.scrollX + rect.left}px`;

    const confidence_color = confidence > 0.8 ? '#16a34a' : confidence > 0.6 ? '#ca8a04' : '#dc2626';
    const source_label = source === 'qa_bank' ? 'Matched from Q&A Bank' : 'AI Generated';

    popup.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; gap:6px; align-items:center;">
                <span style="font-weight:700; font-size:13px;">Review Answer</span>
                <span style="padding:2px 8px; border-radius:999px; background:${confidence_color}15; color:${confidence_color}; font-size:11px; font-weight:600;">
                    ${Math.round(confidence * 100)}% confidence
                </span>
            </div>
            <span style="font-size:11px; color:#94a3b8;">${source_label}</span>
        </div>
        <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-style:italic;">
            Q: ${question_text.slice(0, 120)}${question_text.length > 120 ? '...' : ''}
        </div>
        <textarea
            class="simplify-review-textarea"
            style="
                width:100%; min-height:80px; padding:10px; border-radius:8px;
                border:1px solid #e2e8f0; font-size:13px; font-family:inherit;
                resize:vertical; box-sizing:border-box; color:#1e293b;
                background:#f8fafc; line-height:1.5;
            "
        >${answer}</textarea>
        <div style="display:flex; gap:8px; margin-top:10px; align-items:center;">
            <button class="simplify-accept-btn" style="
                padding:8px 16px; border-radius:8px; border:none;
                background:linear-gradient(135deg,#4f46e5,#6366f1); color:#fff;
                font-weight:600; font-size:12px; cursor:pointer;
                box-shadow:0 2px 8px rgba(79,70,229,0.25);
            ">Accept & Fill</button>
            <button class="simplify-reject-btn" style="
                padding:8px 16px; border-radius:8px;
                border:1px solid #e2e8f0; background:#fff; color:#64748b;
                font-weight:600; font-size:12px; cursor:pointer;
            ">Skip</button>
            <label style="display:flex; align-items:center; gap:4px; margin-left:auto; font-size:11px; color:#64748b; cursor:pointer;">
                <input type="checkbox" class="simplify-save-check" checked style="margin:0;" />
                Save to Q&A Bank
            </label>
        </div>
    `;

    const textarea = popup.querySelector('.simplify-review-textarea') as HTMLTextAreaElement;
    const accept_btn = popup.querySelector('.simplify-accept-btn') as HTMLButtonElement;
    const reject_btn = popup.querySelector('.simplify-reject-btn') as HTMLButtonElement;
    const save_check = popup.querySelector('.simplify-save-check') as HTMLInputElement;

    const original_answer = answer;

    accept_btn.addEventListener('click', () => {
        const final_answer = textarea.value.trim();
        const was_edited = final_answer !== original_answer;
        if (final_answer) {
            onAccept(final_answer, was_edited);
            if (save_check.checked) {
                onSave(question_text, final_answer, original_answer, was_edited);
            }
        }
        popup.remove();
    });

    reject_btn.addEventListener('click', () => {
        onReject();
        popup.remove();
    });

    document.body.appendChild(popup);
    return popup;
}

// ========================================================================
// Custom Question Handling
// ========================================================================

async function handleCustomQuestions(
    form: HTMLFormElement | HTMLElement,
    unknownFields: any[],
    fieldsMetadata: any[]
) {
    const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
    const headers = await getAuthHeaders();
    const job_description = scrapeJobDescription();

    // Separate custom questions from standard unknown fields
    const custom_questions: any[] = [];
    const standard_unknowns: any[] = [];

    for (const uf of unknownFields) {
        const idx = parseInt(uf.field_id.replace('field_', ''));
        const meta = fieldsMetadata[idx];

        if (isCustomQuestion(meta)) {
            custom_questions.push({ ...uf, meta, idx });
        } else {
            standard_unknowns.push(uf);
        }
    }

    // Handle standard unknown fields with the existing AI agent
    if (standard_unknowns.length > 0) {
        showAIEnhancementOption(form, standard_unknowns, fieldsMetadata);
    }

    // Handle custom questions one by one with inline review
    if (custom_questions.length > 0) {
        showNotification(`Found ${custom_questions.length} custom question(s) - generating answers...`, 'info');

        for (const cq of custom_questions) {
            const element = elements[cq.idx];
            if (!element) continue;

            const question_text = cq.meta.label || cq.meta.surrounding_text || cq.meta.placeholder || '';
            if (!question_text) continue;

            try {
                // Call the custom answer endpoint
                const response = await fetch(`${API_URL}/v1/mapping/custom-answer`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        question_text,
                        job_description,
                        url: window.location.href,
                    }),
                });

                if (!response.ok) continue;
                const data = await response.json();

                if (data.answer) {
                    // Highlight the field
                    element.style.outline = '2px solid #6366f1';
                    element.style.backgroundColor = '#eef2ff';

                    // Show inline review popup
                    createInlineReviewPopup(
                        element,
                        question_text,
                        data.answer,
                        data.confidence || 0.7,
                        data.source || 'ai_generated',
                        // On Accept
                        async (final_answer: string, was_edited: boolean) => {
                            await fillField(element, final_answer);
                            element.style.outline = '2px solid #16a34a';
                            element.style.backgroundColor = '#f0fdf4';
                            setTimeout(() => {
                                element.style.outline = '';
                                element.style.backgroundColor = '';
                            }, 3000);

                            // Track acceptance/edit for learning
                            trackAnswerFeedback(question_text, final_answer, data.answer, was_edited, headers);
                        },
                        // On Reject
                        () => {
                            element.style.outline = '';
                            element.style.backgroundColor = '';
                        },
                        // On Save to Q&A Bank
                        async (question: string, answer: string, original_answer: string, was_edited: boolean) => {
                            try {
                                const tags = was_edited ? ['user-edited'] : ['ai-accepted'];
                                await fetch(`${API_URL}/v1/mapping/qa-bank`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({
                                        question_text: question,
                                        answer_text: answer,
                                        tags,
                                    }),
                                });
                            } catch (e) {
                                console.error('[QABank] Failed to save answer:', e);
                            }
                        }
                    );
                }
            } catch (error) {
                console.error('[CustomQ] Failed to generate answer:', error);
            }
        }
    }
}

function clearPreviewHighlights() {
    const highlighted = document.querySelectorAll('[data-simplify-preview="1"]');
    highlighted.forEach((el: any) => {
        el.style.outline = '';
        el.style.backgroundColor = '';
        el.removeAttribute('data-simplify-preview');
    });
    // Remove confidence badges
    document.querySelectorAll('.simplify-confidence-badge').forEach(el => el.remove());
    // Remove any review popups and panels
    document.querySelectorAll('.simplify-inline-review').forEach(el => el.remove());
    document.querySelectorAll('.simplify-review-panel').forEach(el => el.remove());
    document.querySelectorAll('.simplify-multistep-controls').forEach(el => el.remove());
}

function highlightField(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: any, confidence: number = 0.9) {
    element.setAttribute('data-simplify-preview', '1');

    // Color-code by confidence
    let outline_color: string;
    let bg_color: string;
    let label_color: string;

    if (confidence > 0.85) {
        // Green: high confidence
        outline_color = '#16a34a';
        bg_color = '#f0fdf4';
        label_color = '#16a34a';
    } else if (confidence > 0.6) {
        // Yellow: medium confidence
        outline_color = '#ca8a04';
        bg_color = '#fefce8';
        label_color = '#ca8a04';
    } else {
        // Red: low confidence
        outline_color = '#dc2626';
        bg_color = '#fef2f2';
        label_color = '#dc2626';
    }

    element.style.outline = `2px dashed ${outline_color}`;
    element.style.backgroundColor = bg_color;
    element.title = `[${Math.round(confidence * 100)}% confidence] Would fill: ${String(value).slice(0, 140)}`;

    // Add a small confidence badge near the field
    const badge = document.createElement('span');
    badge.className = 'simplify-confidence-badge';
    badge.style.cssText = `
        position: absolute; top: -8px; right: -8px;
        background: ${label_color}; color: white;
        font-size: 10px; font-weight: 700; padding: 2px 6px;
        border-radius: 999px; z-index: 999999;
        font-family: system-ui, sans-serif;
        pointer-events: none;
    `;
    badge.textContent = `${Math.round(confidence * 100)}%`;

    const parent = element.parentElement;
    if (parent) {
        const prev_style = parent.style.position;
        if (!prev_style || prev_style === 'static') {
            parent.style.position = 'relative';
        }
        parent.appendChild(badge);
    }
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
            from { opacity: 0; transform: translateX(100px); }
            to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }
            50% { box-shadow: 0 4px 30px rgba(102, 126, 234, 0.6); }
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
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
    // 3. Show review panel OR fill fields directly
    // 4. Detect custom questions + use Q&A Bank / AI for unknown fields
    // 5. Multi-step form support
    // ========================================================================

    const formSignature = generateFormSignature(fieldsMetadata);
    const url = window.location.href;

    // Step 1: Try cache first
    const cachedMappings = await getCachedMapping(formSignature, url);
    let results: any[] = [];

    if (cachedMappings && cachedMappings.length > 0) {
        console.log('[Autofill] Using cached mappings');
        showNotification('Using cached mappings...', 'info');

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
        showNotification('Smart autofill analyzing form...', 'info');

        results = fillFormWithRules(fieldsMetadata, currentProfile);
    }

    // Separate filled vs unknown
    const filledResults = results.filter(r => r.action === 'fill');
    const unknownFields = results.filter(r => r.needsAI === true);
    const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);

    // Step 3: Show pre-fill review panel (if enabled) or fill directly
    if (autofillOptions.dryRun) {
        // Dry run: use review panel
        showReviewPanel(form, filledResults, unknownFields, fieldsMetadata, elements, formSignature, url, cachedMappings);
    } else {
        // Direct fill
        await executeFieldFilling(form, filledResults, elements, formSignature, url, cachedMappings, results);

        // Step 4: Handle unknown fields
        if (unknownFields.length > 0) {
            console.log(`[Autofill] ${unknownFields.length} unknown fields - processing custom questions`);
            await handleCustomQuestions(form, unknownFields, fieldsMetadata);
        }

        // Step 5: Multi-step form support
        showMultiStepControls(form);
    }
}

/**
 * Execute actual field filling
 */
async function executeFieldFilling(
    form: HTMLFormElement | HTMLElement,
    filledResults: any[],
    elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[],
    formSignature: string,
    url: string,
    cachedMappings: any,
    allResults: any[]
) {
    let filledCount = 0;

    for (const res of filledResults) {
        if (res.action === 'skip' || !res.value) continue;

        const idx = parseInt(res.field_id.replace('field_', ''));
        const element = elements[idx];

        if (element) {
            await fillField(element, res.value);
            filledCount++;

            if (filledCount % 5 === 0) {
                updateProgressNotification(filledCount, filledResults.length);
            }
        }
    }

    showNotification(`Filled ${filledCount} fields instantly!`, 'success');

    // Save to cache for next time (only if not from cache)
    if (!cachedMappings) {
        const mappingsToCache = allResults
            .filter(r => r.action === 'fill')
            .map(r => {
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

// ========================================================================
// Pre-Fill Review Panel
// ========================================================================

function showReviewPanel(
    form: HTMLFormElement | HTMLElement,
    filledResults: any[],
    unknownFields: any[],
    fieldsMetadata: any[],
    elements: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[],
    formSignature: string,
    url: string,
    cachedMappings: any
) {
    // Remove any existing panel
    document.querySelectorAll('.simplify-review-panel').forEach(el => el.remove());

    const panel = document.createElement('div');
    panel.className = 'simplify-review-panel';
    panel.style.cssText = `
        position: fixed; top: 80px; right: 20px; width: 380px; max-height: 70vh;
        background: #ffffff; border: 1px solid #c7d2fe; border-radius: 14px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.15); z-index: 2147483646;
        font-family: system-ui, -apple-system, sans-serif; overflow: hidden;
        display: flex; flex-direction: column;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 14px 16px; border-bottom: 1px solid #e2e8f0;
        background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;
    `;
    header.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="font-weight:700; font-size:15px;">Review Autofill</div>
                <div style="font-size:12px; opacity:0.85; margin-top:2px;">${filledResults.length} fields to fill</div>
            </div>
            <button class="simplify-close-review" style="
                background:none; border:none; color:white; font-size:20px;
                cursor:pointer; padding:4px 8px; line-height:1;
            ">&times;</button>
        </div>
    `;
    panel.appendChild(header);

    // Field list (scrollable)
    const list = document.createElement('div');
    list.style.cssText = `
        flex: 1; overflow-y: auto; padding: 8px;
    `;

    // Track which fields are approved
    const field_states: Map<string, { approved: boolean; value: string }> = new Map();

    for (const res of filledResults) {
        if (!res.value) continue;

        const idx = parseInt(res.field_id.replace('field_', ''));
        const meta = fieldsMetadata[idx];
        const field_label = meta?.label || meta?.name || meta?.placeholder || res.field_id;
        const confidence = res.confidence || 0.9;
        const confidence_color = confidence > 0.85 ? '#16a34a' : confidence > 0.6 ? '#ca8a04' : '#dc2626';

        field_states.set(res.field_id, { approved: true, value: String(res.value) });

        const row = document.createElement('div');
        row.style.cssText = `
            padding: 10px 12px; margin-bottom: 6px; border-radius: 8px;
            border: 1px solid #e2e8f0; background: #fafafa;
            transition: background 0.2s;
        `;
        row.dataset.fieldId = res.field_id;

        row.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" class="simplify-field-check" data-field-id="${res.field_id}" checked
                        style="margin:0; width:14px; height:14px; cursor:pointer;" />
                    <span style="font-size:12px; font-weight:600; color:#334155;">
                        ${escapeHtml(field_label.slice(0, 40))}
                    </span>
                </div>
                <span style="
                    padding:2px 6px; border-radius:999px; font-size:10px; font-weight:600;
                    background:${confidence_color}15; color:${confidence_color};
                ">${Math.round(confidence * 100)}%</span>
            </div>
            <input type="text" class="simplify-field-value" data-field-id="${res.field_id}"
                value="${escapeHtml(String(res.value).slice(0, 200))}"
                style="
                    width:100%; padding:6px 8px; border-radius:6px; border:1px solid #e2e8f0;
                    font-size:12px; font-family:inherit; box-sizing:border-box;
                    color:#1e293b; background:#fff;
                "
            />
        `;

        // Handle checkbox toggle
        const checkbox = row.querySelector('.simplify-field-check') as HTMLInputElement;
        checkbox.addEventListener('change', () => {
            const state = field_states.get(res.field_id);
            if (state) state.approved = checkbox.checked;
            row.style.opacity = checkbox.checked ? '1' : '0.5';
        });

        // Handle value edit
        const input = row.querySelector('.simplify-field-value') as HTMLInputElement;
        input.addEventListener('input', () => {
            const state = field_states.get(res.field_id);
            if (state) state.value = input.value;
        });

        // Highlight field on hover
        row.addEventListener('mouseenter', () => {
            const element = elements[idx];
            if (element) {
                element.style.outline = '2px solid #6366f1';
                element.style.backgroundColor = '#eef2ff';
            }
        });
        row.addEventListener('mouseleave', () => {
            const element = elements[idx];
            if (element) {
                element.style.outline = '';
                element.style.backgroundColor = '';
            }
        });

        list.appendChild(row);
    }

    panel.appendChild(list);

    // Footer with action buttons
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 12px 16px; border-top: 1px solid #e2e8f0;
        display: flex; gap: 8px; align-items: center;
    `;
    footer.innerHTML = `
        <button class="simplify-approve-all" style="
            flex: 1; padding: 10px; border-radius: 8px; border: none;
            background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;
            font-weight: 700; font-size: 13px; cursor: pointer;
            box-shadow: 0 2px 8px rgba(79,70,229,0.25);
        ">Fill Selected (${filledResults.filter(r => r.value).length})</button>
        <button class="simplify-skip-all" style="
            padding: 10px 16px; border-radius: 8px;
            border: 1px solid #e2e8f0; background: #fff; color: #64748b;
            font-weight: 600; font-size: 13px; cursor: pointer;
        ">Cancel</button>
    `;
    panel.appendChild(footer);

    document.body.appendChild(panel);

    // Event: Close
    panel.querySelector('.simplify-close-review')!.addEventListener('click', () => {
        panel.remove();
    });

    // Event: Fill Selected
    panel.querySelector('.simplify-approve-all')!.addEventListener('click', async () => {
        panel.remove();

        // Build approved results
        const approved_results = filledResults.filter(res => {
            const state = field_states.get(res.field_id);
            return state?.approved && state?.value;
        }).map(res => ({
            ...res,
            value: field_states.get(res.field_id)?.value || res.value,
        }));

        // Switch off dry run temporarily for actual fill
        const was_dry_run = autofillOptions.dryRun;
        autofillOptions.dryRun = false;

        await executeFieldFilling(form, approved_results, elements, formSignature, url, cachedMappings, approved_results);

        // Handle unknown fields
        if (unknownFields.length > 0) {
            await handleCustomQuestions(form, unknownFields, fieldsMetadata);
        }

        showMultiStepControls(form);
        autofillOptions.dryRun = was_dry_run;
    });

    // Event: Skip All
    panel.querySelector('.simplify-skip-all')!.addEventListener('click', () => {
        panel.remove();
    });
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ========================================================================
// Answer Learning & Feedback Tracking
// ========================================================================

/**
 * Track when a user accepts, edits, or rejects an AI-generated answer.
 * This data is used to improve future answer generation.
 */
async function trackAnswerFeedback(
    question_text: string,
    accepted_answer: string,
    original_ai_answer: string,
    was_edited: boolean,
    headers: Record<string, string>
) {
    try {
        await fetch(`${API_URL}/v1/mapping/qa-bank/feedback`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                question_text,
                accepted_answer,
                original_ai_answer,
                was_edited,
                url: window.location.href,
            }),
        });
    } catch (e) {
        // Silent fail - feedback tracking is non-critical
        console.debug('[Feedback] Failed to track:', e);
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

// Show AI enhancement option for unknown fields (non-custom-question)
function showAIEnhancementOption(
    form: HTMLFormElement | HTMLElement,
    unknownFields: any[],
    fieldsMetadata: any[]
) {
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
    setTimeout(() => enhanceBtn.remove(), 10000);
}

// Fill unknown fields using AI
async function fillUnknownFieldsWithAI(
    form: HTMLFormElement | HTMLElement,
    unknownFields: any[],
    fieldsMetadata: any[]
) {
    showNotification('AI analyzing remaining fields...', 'info');

    try {
        const headers = await getAuthHeaders();

        const unknownFieldsMetadata = unknownFields.map(uf => {
            const idx = parseInt(uf.field_id.replace('field_', ''));
            return fieldsMetadata[idx];
        });

        const response = await fetch(`${API_URL}/v1/mapping/agent-fill`, {
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

        const elements = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
        let aiFilledCount = 0;

        for (const res of aiResults) {
            if (res.action === 'skip') continue;

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
            showNotification(`AI filled ${aiFilledCount} more fields!`, 'success');
        } else {
            showNotification('AI could not fill remaining fields', 'info');
        }

    } catch (error) {
        console.error('[Autofill] AI enhancement failed:', error);
        showNotification('AI enhancement unavailable', 'error');
    }
}

function showNotification(message: string, type: 'success' | 'error' | 'info') {
    // Remove existing notifications
    document.querySelectorAll('[data-simplify-notification]').forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.setAttribute('data-simplify-notification', '1');
    notification.style.cssText = `
        position: fixed; top: 80px; right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white; padding: 12px 20px; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 2147483647;
        font-family: system-ui, sans-serif; font-size: 14px;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

async function trackApplication(form: HTMLFormElement | HTMLElement) {
    try {
        const headers = await getAuthHeaders();
        
        await fetch(`${API_URL}/v1/applications`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                url: window.location.href,
                company: scrapeCompanyName() || document.title,
                jobTitle: scrapeJobTitle(),
                dateApplied: new Date().toISOString()
            }),
        });
    } catch (e) { /* silent fail */ }
}

function scoreForm(form: HTMLElement | HTMLFormElement): number {
    const inputs = getAllFillableElements(form.shadowRoot ? form.shadowRoot : form);
    if (inputs.length < 3) return -10;

    let score = inputs.length * 2;
    
    const text = (form.textContent || '').toLowerCase();
    if (text.includes('apply') || text.includes('application')) score += 20;
    if (text.includes('resume') || text.includes('cv')) score += 30;
    if (text.includes('search') || text.includes('find job')) score -= 20;
    if (text.includes('login') || text.includes('sign in')) score -= 20;

    return score;
}

// ========================================================================
// Multi-Strategy Form Detection
// ========================================================================

let currentPlatform: PlatformType = 'generic';
let currentAdapter: PlatformAdapter | null = null;

/**
 * Multi-strategy form detection:
 * 1. Platform-specific adapter detection (most accurate for known platforms)
 * 2. Standard <form> tag detection
 * 3. Virtual form detection via known selectors
 * 4. Field clustering (groups fillable fields by DOM proximity)
 * 5. Full-page fallback (treat entire page as form)
 */
function detectForms() {
    // Detect platform
    currentPlatform = detectPlatform();
    currentAdapter = getAdapter(currentPlatform);

    let bestForm: HTMLElement | null = null;
    let maxScore = 0;

    // Strategy 1: Platform-specific adapter
    if (currentAdapter) {
        console.log(`[Simplify-for-India] Platform detected: ${currentPlatform}`);
        const adapter_forms = currentAdapter.detectForms();
        for (const f of adapter_forms) {
            const s = scoreForm(f);
            if (s > maxScore) {
                maxScore = s;
                bestForm = f;
            }
        }
    }

    // Strategy 2: Standard <form> detection
    if (!bestForm || maxScore < 10) {
        const forms = Array.from(document.querySelectorAll('form'));
        for (const f of forms) {
            const s = scoreForm(f);
            if (s > maxScore) {
                maxScore = s;
                bestForm = f;
            }
        }
    }

    // Strategy 3: Virtual form detection via known selectors
    if (!bestForm || maxScore < 10) {
        const virtualSelectors = [
            '[class*="application"]', '[id*="application"]',
            '[class*="apply"]', '[id*="apply"]',
            '.job-form', '[role="form"]',
            '[class*="greenhouse"]', '[class*="lever"]',
            '[class*="career"]', '[class*="job-detail"]',
            '[class*="questionnaire"]', '[class*="form-container"]',
        ];
        const virtualForms = Array.from(
            document.querySelectorAll(virtualSelectors.join(','))
        ) as HTMLElement[];

        for (const f of virtualForms) {
            const s = scoreForm(f);
            if (s > maxScore) {
                maxScore = s;
                bestForm = f;
            }
        }
    }

    // Strategy 4: Field clustering (for truly ambiguous pages)
    if (!bestForm || maxScore < 10) {
        const all_elements = getAllFillableElements(document);
        if (all_elements.length >= 3) {
            const clusters = clusterFieldsByProximity(all_elements);
            if (clusters.length > 0 && clusters[0].score > 5) {
                const best_cluster = clusters[0];
                // Use the cluster's root as the form
                if (best_cluster.score > maxScore) {
                    maxScore = best_cluster.score;
                    bestForm = best_cluster.root;
                    console.log(`[Simplify-for-India] Using field cluster as form (${best_cluster.elements.length} fields)`);
                }
            }
        }
    }

    // Strategy 5: Full-page fallback
    if (!bestForm || maxScore < 5) {
        const body_elements = getAllFillableElements(document);
        if (body_elements.length >= 3) {
            const main = document.querySelector('main, [role="main"]') as HTMLElement || document.body;
            const s = scoreForm(main);
            if (s > maxScore) {
                maxScore = s;
                bestForm = main;
                console.log('[Simplify-for-India] Using full-page fallback');
            }
        }
    }

    // Remove old buttons
    autofillButtons.forEach(b => b.remove());
    autofillButtons = [];

    if (bestForm && maxScore > 5) {
        console.log(`[Simplify-for-India] Best form found (${currentPlatform}):`, bestForm, `Score: ${maxScore}`);
        const btn = createAutofillButton(bestForm);
        document.body.appendChild(btn);
        autofillButtons.push(btn);
    }
}

// ========================================================================
// Multi-Step Form Support
// ========================================================================

interface FormStepState {
    current_step: number;
    total_steps_detected: number;
    filled_steps: Set<number>;
}

let formStepState: FormStepState = {
    current_step: 0,
    total_steps_detected: 0,
    filled_steps: new Set(),
};

/**
 * Detect step indicators in the form (progress bars, step numbers, breadcrumbs)
 */
function detectSteps(form: HTMLElement): { current: number; total: number } {
    // Look for step indicators
    const step_selectors = [
        '[class*="step"]', '[class*="Step"]',
        '[class*="progress"]', '[class*="Progress"]',
        '[class*="wizard"]', '[class*="Wizard"]',
        '[aria-label*="step"]', '[aria-label*="Step"]',
        '.breadcrumb', '[class*="breadcrumb"]',
    ];

    for (const sel of step_selectors) {
        const indicator = form.querySelector(sel) || document.querySelector(sel);
        if (indicator) {
            const text = indicator.textContent || '';
            // Try to extract "Step X of Y" pattern
            const match = text.match(/(?:step|page)\s*(\d+)\s*(?:of|\/)\s*(\d+)/i);
            if (match) {
                return { current: parseInt(match[1]), total: parseInt(match[2]) };
            }
        }
    }

    // Count step indicators (active/inactive dots/numbers)
    const step_items = document.querySelectorAll(
        '[class*="step-item"], [class*="stepItem"], [class*="wizard-step"], .step'
    );
    if (step_items.length > 1) {
        let current = 1;
        step_items.forEach((item, idx) => {
            const classes = item.className.toLowerCase();
            if (classes.includes('active') || classes.includes('current')) {
                current = idx + 1;
            }
        });
        return { current, total: step_items.length };
    }

    return { current: 1, total: 1 };
}

/**
 * Find and click the "Next" or "Continue" button for multi-step forms
 */
function findNextButton(form: HTMLElement): HTMLElement | null {
    // Platform-specific first
    if (currentAdapter?.getNextButton) {
        const btn = currentAdapter.getNextButton(form);
        if (btn) return btn;
    }

    // Generic patterns
    const button_selectors = [
        'button[class*="next"]', 'button[class*="Next"]',
        'button[class*="continue"]', 'button[class*="Continue"]',
        'button[class*="proceed"]', 'button[class*="Proceed"]',
        '[class*="next-btn"]', '[class*="nextBtn"]',
        'a[class*="next"]', 'a[class*="Next"]',
    ];

    for (const sel of button_selectors) {
        const btn = form.querySelector(sel) || document.querySelector(sel);
        if (btn && isElementVisible(btn as HTMLElement)) return btn as HTMLElement;
    }

    // Search by button text
    const all_buttons = form.querySelectorAll('button, [role="button"], a.btn, input[type="button"]');
    for (const btn of Array.from(all_buttons)) {
        const text = btn.textContent?.trim().toLowerCase() || '';
        const value = (btn as HTMLInputElement).value?.toLowerCase() || '';
        const combined = `${text} ${value}`;

        if (
            combined.match(/^next$/i) ||
            combined.match(/^continue$/i) ||
            combined.match(/^proceed$/i) ||
            combined.match(/^save\s*&?\s*continue$/i) ||
            combined.match(/^save\s*&?\s*next$/i)
        ) {
            if (isElementVisible(btn as HTMLElement)) return btn as HTMLElement;
        }
    }

    return null;
}

function isElementVisible(el: HTMLElement): boolean {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
}

/**
 * Show multi-step form controls after filling current step
 */
function showMultiStepControls(form: HTMLElement) {
    const steps = detectSteps(form);
    const next_btn = findNextButton(form);

    if (!next_btn || steps.total <= 1) return;

    // Don't show if already on last step
    if (currentAdapter?.isLastStep?.(form)) return;

    const controls = document.createElement('div');
    controls.className = 'simplify-multistep-controls';
    controls.style.cssText = `
        position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white; padding: 12px 24px; border-radius: 12px;
        box-shadow: 0 4px 20px rgba(102,126,234,0.4); z-index: 2147483646;
        font-family: system-ui, sans-serif; font-size: 14px; font-weight: 600;
        display: flex; align-items: center; gap: 12px;
    `;

    controls.innerHTML = `
        <span>Step ${steps.current} of ${steps.total} filled</span>
        <button id="simplify-next-step" style="
            padding: 8px 16px; border-radius: 8px; border: 2px solid white;
            background: transparent; color: white; font-weight: 700; font-size: 13px;
            cursor: pointer;
        ">Fill Next Step →</button>
        <button id="simplify-dismiss-step" style="
            padding: 8px 12px; border-radius: 8px; border: none;
            background: rgba(255,255,255,0.15); color: white; font-size: 12px;
            cursor: pointer;
        ">Dismiss</button>
    `;

    document.body.appendChild(controls);

    controls.querySelector('#simplify-next-step')!.addEventListener('click', async () => {
        controls.remove();
        // Click the next button
        next_btn.click();

        // Wait for page transition
        await new Promise(r => setTimeout(r, 1500));

        // Re-detect and fill the new step
        formStepState.current_step++;
        formStepState.filled_steps.add(formStepState.current_step - 1);

        detectForms();
        // Auto-trigger fill on next step
        const new_btn = document.querySelector('.simplify-india-autofill-btn div') as HTMLElement;
        if (new_btn) new_btn.click();
    });

    controls.querySelector('#simplify-dismiss-step')!.addEventListener('click', () => {
        controls.remove();
    });

    // Auto-remove after 15 seconds
    setTimeout(() => controls.remove(), 15000);
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
setInterval(detectForms, 3000);
