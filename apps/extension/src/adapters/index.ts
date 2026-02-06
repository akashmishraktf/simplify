/**
 * Platform-Specific Adapters
 * Each adapter knows how to detect forms and extract fields on a specific platform.
 */

import { PlatformType } from '../utils/fieldMapper';
import { NaukriAdapter } from './naukri';
import { GoogleFormsAdapter } from './googleForms';
import { TypeformAdapter } from './typeform';
import { GreenhouseAdapter } from './greenhouse';
import { LeverAdapter } from './lever';
import { WorkdayAdapter } from './workday';

export interface PlatformAdapter {
    /** Platform identifier */
    platform: PlatformType;

    /** Find all form containers on the page */
    detectForms(): HTMLElement[];

    /** Get all fillable elements within a form container */
    getFields(form: HTMLElement): HTMLElement[];

    /** Optional: Custom fill logic for platform-specific widgets */
    fillField?(element: HTMLElement, value: any): Promise<boolean>;

    /** Optional: Detect and click "Next" button for multi-step forms */
    getNextButton?(form: HTMLElement): HTMLElement | null;

    /** Optional: Check if the current step is the last one */
    isLastStep?(form: HTMLElement): boolean;
}

const adapters: Record<string, PlatformAdapter> = {
    naukri: new NaukriAdapter(),
    google_forms: new GoogleFormsAdapter(),
    typeform: new TypeformAdapter(),
    greenhouse: new GreenhouseAdapter(),
    lever: new LeverAdapter(),
    workday: new WorkdayAdapter(),
};

export function getAdapter(platform: PlatformType): PlatformAdapter | null {
    return adapters[platform] || null;
}

export { NaukriAdapter, GoogleFormsAdapter, TypeformAdapter, GreenhouseAdapter, LeverAdapter, WorkdayAdapter };

