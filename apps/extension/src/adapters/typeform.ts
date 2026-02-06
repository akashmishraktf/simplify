import { PlatformAdapter } from './index';

/**
 * Typeform Adapter
 * Handles Typeform's one-question-at-a-time UX, detects the active question,
 * fills it, and triggers navigation to the next question.
 */
export class TypeformAdapter implements PlatformAdapter {
    platform = 'typeform' as const;

    detectForms(): HTMLElement[] {
        const forms: HTMLElement[] = [];

        // Typeform renders the active question in a visible block
        const typeform_selectors = [
            '[data-tf-element]',
            '.tf-v1-popup',
            '[class*="QuestionWrapper"]',
            '[class*="SlideWrapper"]',
            '.root',
        ];

        for (const sel of typeform_selectors) {
            const el = document.querySelector(sel) as HTMLElement;
            if (el) {
                forms.push(el);
                break;
            }
        }

        // Embedded typeform via iframe - handled by all_frames: true
        // But try same-origin iframes too
        document.querySelectorAll('iframe[src*="typeform"]').forEach(iframe => {
            try {
                const doc = (iframe as HTMLIFrameElement).contentDocument;
                if (doc) {
                    const form = doc.querySelector('[data-tf-element], form') as HTMLElement;
                    if (form) forms.push(form);
                }
            } catch (e) { /* cross-origin */ }
        });

        return forms;
    }

    getFields(form: HTMLElement): HTMLElement[] {
        const fields: HTMLElement[] = [];

        // Active question only (Typeform shows one at a time)
        const active_question = form.querySelector(
            '[class*="active"], [aria-hidden="false"], [data-qa="question"]'
        ) || form;

        // Standard text inputs
        active_question.querySelectorAll('input, select, textarea').forEach(el => {
            fields.push(el as HTMLElement);
        });

        // Typeform custom choice buttons (radio-like)
        active_question.querySelectorAll('[role="option"], [class*="Choice"], [data-qa="choice"]').forEach(el => {
            fields.push(el as HTMLElement);
        });

        return fields;
    }

    async fillField(element: HTMLElement, value: any): Promise<boolean> {
        // Handle Typeform choice buttons (click-based selection)
        if (element.getAttribute('role') === 'option' ||
            element.classList.toString().includes('Choice') ||
            element.getAttribute('data-qa') === 'choice') {

            const text = element.textContent?.trim().toLowerCase() || '';
            if (text.includes(String(value).toLowerCase())) {
                element.click();
                return true;
            }
            return false;
        }

        return false; // Use default fill
    }

    getNextButton(form: HTMLElement): HTMLElement | null {
        // Typeform uses "OK" or arrow buttons to proceed
        const selectors = [
            'button[data-qa="ok-button-visible"]',
            'button[class*="NavigationButton"]',
            'button[class*="ButtonWrapper"]',
            '[data-qa="submit-button"]',
            'button[type="submit"]',
        ];

        for (const sel of selectors) {
            const btn = document.querySelector(sel) as HTMLElement;
            if (btn) return btn;
        }

        // Also look for Enter key hint
        return null;
    }

    isLastStep(form: HTMLElement): boolean {
        const submit = document.querySelector('[data-qa="submit-button"], button[type="submit"]');
        return !!submit;
    }
}

