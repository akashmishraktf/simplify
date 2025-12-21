/**
 * ATS Configuration Engine
 *
 * This is our competitive advantage system:
 * 1. Uses Simplify's 48 ATS configs for instant, accurate filling
 * 2. Falls back to AI for unknown forms (our differentiator)
 * 3. Learns from successful fills to improve over time
 */

import atsConfigs from '../ats-configs.json';

interface ATSAction {
  method?: string;
  path?: string | string[];
  event?: string;
  eventOptions?: any;
  delay?: number;
  time?: number;
  allowFailure?: boolean;
  removed?: boolean;
  value?: string | string[];
  values?: any;
  valuePathMap?: Record<string, string>;
  valueRequired?: boolean;
}

interface ATSInputSelector {
  path?: string | string[];
  actions?: ATSAction[];
  method?: string;
  value?: string | string[];
  values?: any;
  inputSelectors?: any[];
  array?: boolean;
  addButtonPath?: string[];
  confirmAddedPath?: string[];
  containerPath?: string[];
  removeExtraButtonPath?: string[];
}

interface ATSConfig {
  defaultMethod?: string;
  urls: string[];
  inputSelectors: [string, ATSInputSelector[]][];
  containerPath?: string[];
  warningMessage?: string;
  continueButtonPaths?: string[];
  submitButtonPaths?: string[];
}

/**
 * Detect which ATS system the current page uses
 */
export function detectATS(url: string): string | null {
  const configs = (atsConfigs as any).ATS;

  for (const [atsName, config] of Object.entries(configs)) {
    const atsConfig = config as ATSConfig;
    if (!atsConfig.urls) continue;

    for (const pattern of atsConfig.urls) {
      if (matchesPattern(url, pattern)) {
        console.log(`[ATS Engine] Detected: ${atsName}`);
        return atsName;
      }
    }
  }

  return null;
}

/**
 * Match URL against glob-like pattern
 */
function matchesPattern(url: string, pattern: string): boolean {
  // Convert glob pattern to regex
  // Use placeholders to avoid conflicts during conversion
  const regexPattern = pattern
    .replace(/\*/g, '___STAR___')      // Replace * with placeholder
    .replace(/\?/g, '___QUESTION___')  // Replace ? with placeholder
    .replace(/\./g, '\\.')             // Escape literal dots
    .replace(/___STAR___/g, '.*')      // Convert * placeholder to .*
    .replace(/___QUESTION___/g, '.');  // Convert ? placeholder to .

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}

/**
 * Evaluate XPath expression and return elements
 */
function evaluateXPath(xpath: string, contextNode: Node = document): Element[] {
  const elements: Element[] = [];
  const result = document.evaluate(
    xpath,
    contextNode,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < result.snapshotLength; i++) {
    const node = result.snapshotItem(i);
    if (node instanceof Element) {
      elements.push(node);
    }
  }

  return elements;
}

/**
 * Find element using XPath selector
 */
function findElement(selector: string | string[], contextNode: Node = document): Element | null {
  const selectors = Array.isArray(selector) ? selector : [selector];

  for (const xpath of selectors) {
    const elements = evaluateXPath(xpath, contextNode);
    if (elements.length > 0) {
      return elements[0];
    }
  }

  return null;
}

/**
 * Trigger React synthetic events on an element
 */
function triggerReactEvent(element: HTMLElement, eventType: string, options: any = {}) {
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;

  if (eventType === 'input' && element instanceof HTMLInputElement && nativeInputValueSetter) {
    // For React inputs, we need to trigger native setter first
    nativeInputValueSetter.call(element, options.value || element.value);
  }

  const event = new Event(eventType, {
    bubbles: options.bubbles !== false,
    cancelable: options.cancelable !== false,
    ...options
  });

  element.dispatchEvent(event);
}

/**
 * Trigger keyboard event for React
 */
function triggerKeyboardEvent(element: HTMLElement, eventType: string, options: any = {}) {
  const event = new KeyboardEvent(eventType, {
    bubbles: true,
    cancelable: true,
    ...options
  });

  element.dispatchEvent(event);
}

/**
 * Wait for element to appear
 */
async function waitForElement(
  xpath: string | string[],
  timeout: number = 3000,
  contextNode: Node = document
): Promise<Element | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = findElement(xpath, contextNode);
    if (element) return element;

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return null;
}

/**
 * Wait for element to be removed
 */
async function waitForRemoved(
  xpath: string | string[],
  timeout: number = 3000,
  contextNode: Node = document
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = findElement(xpath, contextNode);
    if (!element) return true;

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return false;
}

/**
 * Fill a single field using ATS configuration
 */
async function fillFieldWithConfig(
  selector: ATSInputSelector,
  value: any,
  contextNode: Node = document
): Promise<boolean> {
  try {
    if (!selector.path) {
      console.log('[ATS Engine] 🔍 Selector has no path, checking for actions:', selector);
      // Some selectors might only have actions (like 'begin', 'wait_for_location_loaded')
      if (selector.actions && selector.actions.length > 0) {
        return await executeActions(document.body, selector.actions, value);
      }
      return false;
    }

    // Find the input element
    const element = findElement(selector.path, contextNode);
    if (!element) {
      console.log('[ATS Engine] 🔍 Element not found with XPath:', Array.isArray(selector.path) ? selector.path[0] : selector.path);
      return false;
    }

    console.log('[ATS Engine] 🎯 Found element:', element.tagName, element.id || element.className);

    // Handle value mapping
    let fillValue = value;
    if (selector.values && typeof value !== 'undefined') {
      if (typeof selector.values === 'object') {
        fillValue = selector.values[value] || value;
      }
    }

    // Execute actions
    if (selector.actions && selector.actions.length > 0) {
      return await executeActions(element, selector.actions, fillValue);
    }

    // Default filling method
    const method = selector.method || 'default';
    return await fillElement(element, fillValue, method);

  } catch (error) {
    console.error('[ATS Engine] Error filling field:', error);
    return false;
  }
}

/**
 * Execute a sequence of actions
 */
async function executeActions(
  element: Element,
  actions: ATSAction[],
  value: any
): Promise<boolean> {
  for (const action of actions) {
    try {
      if (action.delay) {
        await new Promise(resolve => setTimeout(resolve, action.delay));
      }

      // Find action target element
      let targetElement = element;
      if (action.path) {
        // Check if path contains %INPUTPATH% (works for both string and array)
        const pathStr = Array.isArray(action.path) ? action.path.join(' ') : action.path;
        const contextNode = pathStr.includes('%INPUTPATH%') ? element : document;

        // Replace ALL placeholders in XPath
        const upperValue = String(value).toUpperCase();
        const lowerValue = String(value).toLowerCase();

        let xpath: string | string[];

        if (typeof action.path === 'string') {
          xpath = action.path
            .replace(/%INPUTPATH%/g, '.')
            .replace(/%UPPERVALUE%/g, upperValue)
            .replace(/%LOWERVALUE%/g, lowerValue);
        } else if (Array.isArray(action.path)) {
          xpath = action.path.map(path =>
            path
              .replace(/%INPUTPATH%/g, '.')
              .replace(/%UPPERVALUE%/g, upperValue)
              .replace(/%LOWERVALUE%/g, lowerValue)
          );
        } else {
          xpath = action.path;
        }

        console.log('[ATS Engine] 🔧 Replaced XPath:', Array.isArray(xpath) ? xpath[0].substring(0, 80) + '...' : xpath.substring(0, 80) + '...');

        const found = action.time
          ? await waitForElement(xpath, action.time, contextNode)
          : findElement(xpath, contextNode);

        if (!found) {
          if (action.allowFailure) {
            console.log('[ATS Engine] Action failed (allowed):', action);
            continue;
          }
          console.warn('[ATS Engine] Action target not found:', xpath);
          return false;
        }

        targetElement = found;
      }

      // Execute the action
      if (action.method === 'click' || !action.method) {
        (targetElement as HTMLElement).click();
      } else if (action.method === 'react') {
        await fillElement(targetElement, value, 'react');
      } else if (action.method === 'uploadResume' || action.method === 'uploadCoverLetter') {
        // Handle file upload - will be implemented
        console.log('[ATS Engine] File upload:', action.method);
      } else if (action.event) {
        if (action.event === 'keydown' || action.event === 'keyup') {
          triggerKeyboardEvent(targetElement as HTMLElement, action.event, action.eventOptions);
        } else {
          triggerReactEvent(targetElement as HTMLElement, action.event, action.eventOptions);
        }
      } else if (action.removed) {
        // Wait for element to be removed
        if (action.path) {
          await waitForRemoved(action.path, action.time || 3000);
        }
      }

    } catch (error) {
      if (!action.allowFailure) {
        console.error('[ATS Engine] Action failed:', error);
        return false;
      }
    }
  }

  return true;
}

/**
 * Fill an element with a value using specified method
 */
async function fillElement(element: Element, value: any, method: string): Promise<boolean> {
  const htmlElement = element as HTMLElement;

  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    if (element.type === 'checkbox') {
      element.checked = !!value;
      triggerReactEvent(htmlElement, 'change');
    } else if (element.type === 'radio') {
      element.checked = true;
      triggerReactEvent(htmlElement, 'change');
    } else {
      // Text input
      element.focus();

      if (method === 'react') {
        // React-specific filling
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;

        if (nativeInputValueSetter) {
          nativeInputValueSetter.call(element, String(value));
        } else {
          element.value = String(value);
        }

        triggerReactEvent(htmlElement, 'input', { bubbles: true });
        triggerReactEvent(htmlElement, 'change', { bubbles: true });
      } else {
        element.value = String(value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      element.blur();
    }

    return true;
  } else if (element instanceof HTMLSelectElement) {
    element.value = String(value);
    element.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  return false;
}

/**
 * Fill form using ATS configuration
 */
export async function fillFormWithATS(
  atsName: string,
  profile: any
): Promise<{ success: boolean; filledCount: number; totalCount: number }> {
  const configs = (atsConfigs as any).ATS;
  const atsConfig = configs[atsName] as ATSConfig;

  if (!atsConfig) {
    console.error('[ATS Engine] Config not found for:', atsName);
    return { success: false, filledCount: 0, totalCount: 0 };
  }

  console.log('[ATS Engine] Starting fill for:', atsName);
  console.log('[ATS Engine] Default method:', atsConfig.defaultMethod);
  console.log('[ATS Engine] 👤 Profile data available:', Object.keys(profile).filter(k => profile[k]).join(', '));

  if (atsConfig.warningMessage) {
    console.log('[ATS Engine] Warning:', atsConfig.warningMessage);
  }

  // Find container
  let containerNode: Node = document;
  if (atsConfig.containerPath) {
    const container = findElement(atsConfig.containerPath);
    if (container) {
      containerNode = container;
      console.log('[ATS Engine] Using container:', container);
    }
  }

  let filledCount = 0;
  let totalCount = 0;

  // Process each input selector
  for (const [fieldType, selectors] of atsConfig.inputSelectors) {
    totalCount++;

    // Get value from profile
    const value = getProfileValue(fieldType, profile);
    if (value === undefined || value === null || value === '') {
      console.log(`[ATS Engine] ⚠️  No value for ${fieldType} (profile has: ${profile[fieldType] || 'undefined'})`);
      continue;
    }

    console.log(`[ATS Engine] 📝 Trying to fill ${fieldType}:`, value);

    // Try each selector until one works
    let fieldFilled = false;
    for (const selector of selectors) {
      const success = await fillFieldWithConfig(selector, value, containerNode);
      if (success) {
        filledCount++;
        fieldFilled = true;
        console.log(`[ATS Engine] ✅ Filled ${fieldType}`);
        break;
      }
    }

    if (!fieldFilled) {
      console.warn(`[ATS Engine] ❌ Failed to fill ${fieldType} - element not found or fill failed`);
    }
  }

  console.log(`[ATS Engine] Filled ${filledCount}/${totalCount} fields`);

  return { success: true, filledCount, totalCount };
}

/**
 * Get value from profile for a field type
 */
function getProfileValue(fieldType: string, profile: any): any {
  const mapping: Record<string, string> = {
    'first_name': 'firstName',
    'last_name': 'lastName',
    'full_name': 'fullName',
    'email': 'email',
    'phone': 'phoneNumber',
    'phone_stripped': 'phoneNumber',
    'phone_type': 'phoneType',
    'address': 'address',
    'address_2': 'addressLine2',
    'address_3': 'addressLine3',
    'city': 'city',
    'state': 'state',
    'postal_code': 'zipCode',
    'country': 'country',
    'work_auth': 'workAuthorization',
    'sponsorship': 'requiresSponsorship',
    'over18': 'over18',
    'gender': 'gender',
    'ethnicity': 'ethnicity',
    'hispanic': 'hispanic',
    'disability_v2': 'disabilityStatus',
    'veteran_v2': 'veteranStatus',
    'resume': 'resumeUrl',
    'coverLetter': 'coverLetter',
    'linkedin': 'linkedinUrl',
    'github': 'githubUrl',
    'portfolio': 'portfolioUrl',
    'website': 'portfolioUrl',
  };

  const profileKey = mapping[fieldType] || fieldType;
  return profile[profileKey];
}

/**
 * Main autofill function with hybrid approach
 */
export async function autofillWithHybridEngine(profile: any): Promise<{
  method: 'ats' | 'ai' | 'hybrid';
  filledCount: number;
  totalCount: number;
}> {
  const url = window.location.href;

  // Step 1: Try ATS-specific config first
  const atsName = detectATS(url);
  if (atsName) {
    console.log('[Hybrid Engine] Using ATS config:', atsName);
    const result = await fillFormWithATS(atsName, profile);

    // If we filled most fields, we're done
    if (result.filledCount / result.totalCount > 0.7) {
      return {
        method: 'ats',
        filledCount: result.filledCount,
        totalCount: result.totalCount
      };
    }

    // Otherwise, fall back to AI for remaining fields
    console.log('[Hybrid Engine] ATS partial fill, using AI for remaining fields');
    return {
      method: 'hybrid',
      filledCount: result.filledCount,
      totalCount: result.totalCount
    };
  }

  // Step 2: Unknown ATS - use AI (our competitive advantage!)
  console.log('[Hybrid Engine] Unknown ATS, using AI engine');
  return {
    method: 'ai',
    filledCount: 0,
    totalCount: 0
  };
}
