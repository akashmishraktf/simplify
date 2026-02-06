import { PlatformAdapter } from './index';

/**
 * Naukri.com Adapter
 * Handles Angular-based custom widgets, naukri-specific components,
 * and the unique DOM structure used by Naukri's application forms.
 */
export class NaukriAdapter implements PlatformAdapter {
    platform = 'naukri' as const;

    detectForms(): HTMLElement[] {
        const forms: HTMLElement[] = [];

        // Naukri uses custom Angular components and specific class patterns
        const selectors = [
            // Apply page forms
            '[class*="styles_JDC"]',
            '[class*="apply-form"]',
            '[class*="chatbot-"]',           // Naukri chatbot-style application
            '[class*="naukri-"]',
            '.apply-content',
            '.form-container',
            '#apply-form',
            '.applyCont',
            // Profile edit pages
            '[class*="editSection"]',
            '[class*="widgetSection"]',
            // Quick apply modal
            '[class*="quickApply"]',
            '.quickApplyModal',
            '[role="dialog"]',
        ];

        for (const sel of selectors) {
            const els = document.querySelectorAll(sel);
            els.forEach(el => {
                if ((el as HTMLElement).querySelectorAll('input, select, textarea, [contenteditable]').length > 0) {
                    forms.push(el as HTMLElement);
                }
            });
        }

        // Also check for forms within shadow DOM (naukri uses web components)
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                const shadow_forms = el.shadowRoot.querySelectorAll('form, [class*="apply"], [class*="form"]');
                shadow_forms.forEach(f => forms.push(f as HTMLElement));
            }
        });

        return forms;
    }

    getFields(form: HTMLElement): HTMLElement[] {
        const fields: HTMLElement[] = [];
        const root = form.shadowRoot || form;

        // Standard inputs
        root.querySelectorAll('input, select, textarea').forEach(el => {
            fields.push(el as HTMLElement);
        });

        // Naukri-specific: dropdown triggers that aren't <select>
        root.querySelectorAll('[class*="dropdown"], [class*="chipset"], [class*="suggestor"]').forEach(el => {
            const input = el.querySelector('input');
            if (input) fields.push(input);
        });

        // Naukri skill/tag inputs
        root.querySelectorAll('[class*="chip-input"] input, [class*="tag-input"] input').forEach(el => {
            fields.push(el as HTMLElement);
        });

        return fields;
    }

    async fillField(element: HTMLElement, value: any): Promise<boolean> {
        // Handle Naukri's custom dropdown widgets
        const is_suggestor = element.closest('[class*="suggestor"], [class*="dropdown"]');

        if (is_suggestor && element instanceof HTMLInputElement) {
            // Type value to trigger suggestion dropdown
            element.focus();
            element.value = String(value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new KeyboardEvent('keydown', { key: String(value)[0], bubbles: true }));

            // Wait for dropdown to appear
            await new Promise(r => setTimeout(r, 500));

            // Try to click the first suggestion
            const suggestions = is_suggestor.querySelectorAll(
                '[class*="option"], [class*="suggestion"], li, [role="option"]'
            );

            for (const suggestion of Array.from(suggestions)) {
                const text = suggestion.textContent?.trim().toLowerCase() || '';
                if (text.includes(String(value).toLowerCase())) {
                    (suggestion as HTMLElement).click();
                    return true;
                }
            }

            // If no exact match, click first suggestion
            if (suggestions.length > 0) {
                (suggestions[0] as HTMLElement).click();
                return true;
            }
        }

        return false; // Fallback to default fill logic
    }

    getNextButton(form: HTMLElement): HTMLElement | null {
        const selectors = [
            'button[class*="next"]',
            'button[class*="continue"]',
            'button[class*="proceed"]',
            '[class*="next-btn"]',
            '[class*="nextBtn"]',
        ];

        for (const sel of selectors) {
            const btn = form.querySelector(sel) as HTMLElement;
            if (btn) return btn;
        }

        // Look for buttons with text content
        const buttons = form.querySelectorAll('button, [role="button"]');
        for (const btn of Array.from(buttons)) {
            const text = btn.textContent?.trim().toLowerCase() || '';
            if (text === 'next' || text === 'continue' || text === 'proceed') {
                return btn as HTMLElement;
            }
        }

        return null;
    }
}

