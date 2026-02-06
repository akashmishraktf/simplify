import { PlatformAdapter } from './index';

/**
 * Lever Adapter
 * Lever uses a clean application form with predictable field names.
 */
export class LeverAdapter implements PlatformAdapter {
    platform = 'lever' as const;

    detectForms(): HTMLElement[] {
        const forms: HTMLElement[] = [];

        const selectors = [
            '.application-form',
            '#application-form',
            '.posting-apply',
            'form[action*="lever"]',
            '.main-apply',
        ];

        for (const sel of selectors) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el) {
                forms.push(el);
            }
        }

        // Lever embedded forms
        if (forms.length === 0) {
            const form = document.querySelector('form') as HTMLElement;
            if (form && document.querySelector('.lever-job-title, [class*="lever"]')) {
                forms.push(form);
            }
        }

        return forms;
    }

    getFields(form: HTMLElement): HTMLElement[] {
        const fields: HTMLElement[] = [];

        form.querySelectorAll('input, select, textarea').forEach(el => {
            fields.push(el as HTMLElement);
        });

        // Lever custom questions
        form.querySelectorAll('.custom-question input, .custom-question select, .custom-question textarea').forEach(el => {
            if (!fields.includes(el as HTMLElement)) {
                fields.push(el as HTMLElement);
            }
        });

        return fields;
    }

    getNextButton(form: HTMLElement): HTMLElement | null {
        const btn = form.querySelector('button[type="submit"], .application-submit button') as HTMLElement;
        return btn;
    }
}

