import { PlatformAdapter } from './index';

/**
 * Workday Adapter
 * Workday uses a complex SPA with custom web components and shadow DOM.
 */
export class WorkdayAdapter implements PlatformAdapter {
    platform = 'workday' as const;

    detectForms(): HTMLElement[] {
        const forms: HTMLElement[] = [];

        const selectors = [
            '[data-automation-id="jobApplicationPage"]',
            '[data-automation-id="applyFormContainer"]',
            '.mainContent',
            '[class*="application"]',
            '[data-automation-id*="form"]',
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el) {
                forms.push(el);
            }
        }

        // Workday often uses shadow DOM
        document.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                const shadow_forms = el.shadowRoot.querySelectorAll('[data-automation-id*="form"], form');
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

        // Workday custom components (data-automation-id based)
        root.querySelectorAll('[data-automation-id*="input"], [data-automation-id*="select"], [data-automation-id*="textArea"]').forEach(el => {
            const input = el.querySelector('input, select, textarea') as HTMLElement;
            if (input && !fields.includes(input)) {
                fields.push(input);
            }
        });

        // Check shadow roots within the form
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) {
                el.shadowRoot.querySelectorAll('input, select, textarea').forEach(inp => {
                    fields.push(inp as HTMLElement);
                });
            }
        });

        return fields;
    }

    async fillField(element: HTMLElement, value: any): Promise<boolean> {
        // Workday uses custom components that need special event handling
        const automation_id = element.closest('[data-automation-id]')?.getAttribute('data-automation-id') || '';

        if (automation_id.includes('select') || automation_id.includes('dropdown')) {
            // Click to open dropdown
            element.click();
            await new Promise(r => setTimeout(r, 400));

            // Find and click the option
            const options = document.querySelectorAll('[data-automation-id*="option"], [role="option"]');
            for (const opt of Array.from(options)) {
                const text = opt.textContent?.trim().toLowerCase() || '';
                if (text.includes(String(value).toLowerCase())) {
                    (opt as HTMLElement).click();
                    return true;
                }
            }
        }

        return false; // Use default fill
    }

    getNextButton(form: HTMLElement): HTMLElement | null {
        const selectors = [
            '[data-automation-id="bottom-navigation-next-button"]',
            '[data-automation-id="nextButton"]',
            'button[data-automation-id*="submit"]',
        ];

        for (const sel of selectors) {
            const btn = document.querySelector(sel) as HTMLElement;
            if (btn) return btn;
        }

        // Fallback: find button with "Next" text
        const buttons = document.querySelectorAll('button');
        for (const btn of Array.from(buttons)) {
            const text = btn.textContent?.trim().toLowerCase() || '';
            if (text === 'next' || text === 'continue') {
                return btn;
            }
        }

        return null;
    }

    isLastStep(form: HTMLElement): boolean {
        const submit = document.querySelector(
            '[data-automation-id*="submit"], button[type="submit"]'
        );
        const next = document.querySelector(
            '[data-automation-id="bottom-navigation-next-button"]'
        );
        return !!submit && !next;
    }
}

