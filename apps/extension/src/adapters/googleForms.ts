import { PlatformAdapter } from './index';

/**
 * Google Forms Adapter
 * Handles Google Forms' unique structure where questions are rendered as
 * [role="listitem"] blocks with dynamic DOM, no standard form IDs,
 * and Material Design components.
 */
export class GoogleFormsAdapter implements PlatformAdapter {
    platform = 'google_forms' as const;

    detectForms(): HTMLElement[] {
        const forms: HTMLElement[] = [];

        // Google Forms wraps everything in a form element
        const gform = document.querySelector('form[action*="formResponse"]') as HTMLElement;
        if (gform) {
            forms.push(gform);
            return forms;
        }

        // Fallback: find the questions container
        const container = document.querySelector('[role="list"]') as HTMLElement;
        if (container) {
            forms.push(container);
            return forms;
        }

        // Another fallback for newer Google Forms
        const freebirdForm = document.querySelector('.freebirdFormviewerViewFormContent') as HTMLElement;
        if (freebirdForm) {
            forms.push(freebirdForm);
        }

        return forms;
    }

    getFields(form: HTMLElement): HTMLElement[] {
        const fields: HTMLElement[] = [];

        // Each question is a [role="listitem"]
        const questions = form.querySelectorAll('[role="listitem"], .freebirdFormviewerComponentsQuestionBaseRoot');

        questions.forEach(q => {
            // Text inputs
            const text_inputs = q.querySelectorAll('input[type="text"], input[type="email"], input[type="url"], input[type="tel"], textarea');
            text_inputs.forEach(el => fields.push(el as HTMLElement));

            // Radio buttons (Material Design)
            const radios = q.querySelectorAll('[role="radio"], input[type="radio"]');
            if (radios.length > 0) {
                fields.push(radios[0] as HTMLElement); // Just push first as representative
            }

            // Checkboxes
            const checkboxes = q.querySelectorAll('[role="checkbox"], input[type="checkbox"]');
            checkboxes.forEach(el => fields.push(el as HTMLElement));

            // Dropdown (Google Forms uses a custom dropdown)
            const dropdown = q.querySelector('[role="listbox"], select');
            if (dropdown) fields.push(dropdown as HTMLElement);

            // Date/time inputs
            const date_inputs = q.querySelectorAll('input[type="date"], input[type="time"]');
            date_inputs.forEach(el => fields.push(el as HTMLElement));
        });

        return fields;
    }

    async fillField(element: HTMLElement, value: any): Promise<boolean> {
        // Handle Google Forms radio buttons (Material Design)
        if (element.getAttribute('role') === 'radio') {
            const question_container = element.closest('[role="listitem"]');
            if (!question_container) return false;

            const all_radios = question_container.querySelectorAll('[role="radio"]');
            for (const radio of Array.from(all_radios)) {
                const label = radio.getAttribute('aria-label') || radio.textContent?.trim() || '';
                if (label.toLowerCase().includes(String(value).toLowerCase())) {
                    (radio as HTMLElement).click();
                    return true;
                }
            }
            return false;
        }

        // Handle Google Forms dropdown
        if (element.getAttribute('role') === 'listbox') {
            (element as HTMLElement).click();
            await new Promise(r => setTimeout(r, 300));

            const options = document.querySelectorAll('[role="option"], [data-value]');
            for (const opt of Array.from(options)) {
                const text = opt.textContent?.trim().toLowerCase() || '';
                if (text.includes(String(value).toLowerCase())) {
                    (opt as HTMLElement).click();
                    return true;
                }
            }
            return false;
        }

        return false; // Use default fill
    }

    getNextButton(form: HTMLElement): HTMLElement | null {
        // Google Forms "Next" button
        const buttons = document.querySelectorAll('[role="button"]');
        for (const btn of Array.from(buttons)) {
            const text = btn.textContent?.trim().toLowerCase() || '';
            if (text === 'next' || text === 'continue') {
                return btn as HTMLElement;
            }
        }
        return null;
    }

    isLastStep(form: HTMLElement): boolean {
        const submit_btn = document.querySelector('[type="submit"], [aria-label="Submit"]');
        return !!submit_btn;
    }
}

