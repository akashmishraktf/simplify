import { PlatformAdapter } from './index';

/**
 * Greenhouse Adapter
 * Greenhouse forms are typically embedded in iframes or use specific class patterns.
 * This adapter handles both hosted and embedded Greenhouse forms.
 */
export class GreenhouseAdapter implements PlatformAdapter {
    platform = 'greenhouse' as const;

    detectForms(): HTMLElement[] {
        const forms: HTMLElement[] = [];

        const selectors = [
            '#application_form',
            '#greenhouse-jobboard',
            '.application-form',
            '[class*="greenhouse"]',
            'form[action*="greenhouse"]',
            '#main_fields',
            '.field-sets',
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el) {
                forms.push(el);
            }
        }

        // If no specific form found, look for the standard application layout
        if (forms.length === 0) {
            const main = document.querySelector('#application, #content, main') as HTMLElement;
            if (main) forms.push(main);
        }

        return forms;
    }

    getFields(form: HTMLElement): HTMLElement[] {
        const fields: HTMLElement[] = [];

        // Standard fields
        form.querySelectorAll('input, select, textarea').forEach(el => {
            fields.push(el as HTMLElement);
        });

        // Greenhouse custom question fields (often use specific data attributes)
        form.querySelectorAll('[class*="custom-question"] input, [class*="custom-question"] textarea, [class*="custom-question"] select').forEach(el => {
            if (!fields.includes(el as HTMLElement)) {
                fields.push(el as HTMLElement);
            }
        });

        return fields;
    }

    getNextButton(form: HTMLElement): HTMLElement | null {
        const btn = form.querySelector('button[type="submit"], input[type="submit"], #submit_app') as HTMLElement;
        return btn;
    }
}

