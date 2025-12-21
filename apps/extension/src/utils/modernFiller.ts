/**
 * Modern Form Filler - Works with current Greenhouse (and other modern ATS)
 *
 * Uses CSS selectors instead of brittle XPath expressions
 * More resilient to DOM changes
 */

interface FillResult {
  success: boolean;
  filledCount: number;
  totalCount: number;
}

/**
 * Smart field detection using multiple strategies
 */
function findFieldElement(fieldName: string, fieldType: 'input' | 'select' | 'textarea' = 'input'): HTMLElement | null {
  // Strategy 1: Direct ID match
  let element = document.getElementById(fieldName);
  if (element) return element as HTMLElement;

  // Strategy 2: Name attribute
  element = document.querySelector(`${fieldType}[name="${fieldName}"], ${fieldType}[name*="${fieldName}"]`);
  if (element) return element as HTMLElement;

  // Strategy 3: Aria-label
  element = document.querySelector(`${fieldType}[aria-label*="${fieldName}" i]`);
  if (element) return element as HTMLElement;

  // Strategy 4: Placeholder
  if (fieldType === 'input') {
    element = document.querySelector(`input[placeholder*="${fieldName}" i]`);
    if (element) return element as HTMLElement;
  }

  // Strategy 5: Label text (find label, then its associated input)
  const labels = Array.from(document.querySelectorAll('label'));
  for (const label of labels) {
    if (label.textContent?.toLowerCase().includes(fieldName.toLowerCase())) {
      const forId = label.getAttribute('for');
      if (forId) {
        element = document.getElementById(forId);
        if (element) return element as HTMLElement;
      }

      // Check if input is nested inside label
      const input = label.querySelector(fieldType);
      if (input) return input as HTMLElement;

      // Check for custom dropdowns (React Select, etc.)
      const customSelect = label.parentElement?.querySelector('[class*="select__value"], [class*="select__container"], [class*="dropdown"]');
      if (customSelect) return customSelect as HTMLElement;
    }
  }

  // Strategy 6: Look for custom dropdown components by label text
  const allText = Array.from(document.querySelectorAll('label, [class*="label"], [class*="question"]'));
  for (const textElement of allText) {
    if (textElement.textContent?.toLowerCase().includes(fieldName.toLowerCase())) {
      // Find nearby select component
      const container = textElement.closest('[class*="field"], [class*="control"], [class*="question"]');
      if (container) {
        const customSelect = container.querySelector('[class*="select__value"], select, input');
        if (customSelect) return customSelect as HTMLElement;
      }
    }
  }

  return null;
}

/**
 * Fill a single field using modern React-compatible methods
 */
function fillField(element: HTMLElement, value: string | boolean): boolean {
  try {
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = !!value;
      } else {
        // React-compatible value setting
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        element.focus();

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, String(value));
        } else {
          element.value = String(value);
        }

        // Trigger all necessary events for React
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
      }
      return true;
    } else if (element instanceof HTMLTextAreaElement) {
      element.focus();
      element.value = String(value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.blur();
      return true;
    } else if (element instanceof HTMLSelectElement) {
      // Try to find matching option by text or value
      const options = Array.from(element.options);
      const valueStr = String(value).toLowerCase();

      // Find best match
      const exactMatch = options.find(opt => opt.value.toLowerCase() === valueStr || opt.text.toLowerCase() === valueStr);
      const partialMatch = options.find(opt => opt.text.toLowerCase().includes(valueStr) || valueStr.includes(opt.text.toLowerCase()));

      if (exactMatch) {
        element.value = exactMatch.value;
      } else if (partialMatch) {
        element.value = partialMatch.value;
      } else {
        element.value = String(value);
      }

      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    } else if (element.className && element.className.includes('select__value')) {
      // Custom React Select dropdown
      return fillCustomDropdown(element, String(value));
    }
  } catch (error) {
    console.error('[Modern Filler] Error filling field:', error);
  }
  return false;
}

/**
 * Fill custom dropdown (React Select, Greenhouse custom dropdowns, etc.)
 */
function fillCustomDropdown(element: HTMLElement, value: string): boolean {
  try {
    console.log('[Modern Filler] Attempting custom dropdown fill for:', value);

    // Click to open dropdown
    element.click();

    // Wait a bit for dropdown to open
    setTimeout(() => {
      // Find the dropdown menu (usually appears in a portal)
      const dropdownMenu = document.querySelector('[class*="select__menu"], [class*="select__option"]')?.parentElement;

      if (!dropdownMenu) {
        console.log('[Modern Filler] Dropdown menu not found');
        return false;
      }

      // Find matching option
      const options = Array.from(dropdownMenu.querySelectorAll('[class*="select__option"]'));
      const valueStr = value.toLowerCase();

      const exactMatch = options.find(opt => opt.textContent?.toLowerCase() === valueStr);
      const partialMatch = options.find(opt => opt.textContent?.toLowerCase().includes(valueStr) || valueStr.includes(opt.textContent?.toLowerCase() || ''));

      const matchedOption = exactMatch || partialMatch;

      if (matchedOption) {
        console.log('[Modern Filler] Found dropdown option:', matchedOption.textContent);
        (matchedOption as HTMLElement).click();
        return true;
      } else {
        console.log('[Modern Filler] No matching option found for:', value);
        // Click outside to close dropdown
        document.body.click();
        return false;
      }
    }, 200);

    return true;
  } catch (error) {
    console.error('[Modern Filler] Error filling custom dropdown:', error);
    return false;
  }
}

/**
 * Modern fill strategy for Greenhouse and similar ATS
 */
export async function fillWithModernStrategy(profile: any): Promise<FillResult> {
  console.log('[Modern Filler] Starting modern fill strategy');

  let filledCount = 0;
  let totalCount = 0;

  // Define field mappings with common variations
  const fieldMappings = [
    { profileKey: 'firstName', searches: ['first name', 'first_name', 'firstname', 'given name'] },
    { profileKey: 'lastName', searches: ['last name', 'last_name', 'lastname', 'family name', 'surname'] },
    { profileKey: 'email', searches: ['email', 'e-mail', 'email address'] },
    { profileKey: 'phoneNumber', searches: ['phone', 'telephone', 'mobile', 'phone number', 'contact number'] },
    { profileKey: 'linkedinUrl', searches: ['linkedin', 'linkedin profile', 'linkedin url'] },
    { profileKey: 'githubUrl', searches: ['github', 'github profile', 'github url'] },
    { profileKey: 'portfolioUrl', searches: ['portfolio', 'website', 'personal website', 'portfolio url'] },
    { profileKey: 'veteranStatus', searches: ['veteran status', 'veteran', 'military veteran'] },
    { profileKey: 'disabilityStatus', searches: ['disability status', 'disability', 'disabled'] },
    { profileKey: 'ethnicity', searches: ['ethnicity', 'race', 'racial', 'ethnic background'] },
    { profileKey: 'gender', searches: ['gender', 'sex'] },
  ];

  for (const mapping of fieldMappings) {
    totalCount++;

    const value = profile[mapping.profileKey];
    if (!value) {
      console.log(`[Modern Filler] ⚠️  No value for ${mapping.profileKey}`);
      continue;
    }

    console.log(`[Modern Filler] 📝 Trying to fill ${mapping.profileKey}:`, value);

    // Try each search variation
    let filled = false;
    for (const searchTerm of mapping.searches) {
      const element = findFieldElement(searchTerm);
      if (element) {
        if (fillField(element, value)) {
          filledCount++;
          filled = true;
          console.log(`[Modern Filler] ✅ Filled ${mapping.profileKey} using "${searchTerm}"`);
          break;
        }
      }
    }

    if (!filled) {
      console.log(`[Modern Filler] ❌ Could not find field for ${mapping.profileKey}`);
    }
  }

  console.log(`[Modern Filler] Filled ${filledCount}/${totalCount} fields`);
  return { success: filledCount > 0, filledCount, totalCount };
}
