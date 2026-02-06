/**
 * Job Description Scraper
 * Extracts job description text from the current page using multiple strategies.
 * Works across mainstream and custom job portals.
 */

// Selectors commonly used for job description sections across portals
const JD_SELECTORS = [
    // Common class/ID patterns
    '[class*="job-description"]',
    '[class*="jobDescription"]',
    '[class*="job_description"]',
    '[class*="jd-content"]',
    '[id*="job-description"]',
    '[id*="jobDescription"]',
    '[id*="job_description"]',

    // ATS-specific
    '[class*="posting-"]',          // Lever
    '[class*="content-wrapper"]',   // Greenhouse
    '.job-details',                  // Generic
    '.job-detail',
    '.job-content',
    '.job-body',
    '.description',
    '.posting-description',
    '.job-posting-description',

    // Indian portals
    '.jd-container',                // Naukri-like
    '[class*="jobDescriptionContent"]',
    '[class*="styles_JDC"]',        // Naukri specific
    '[class*="job-desc"]',
    '.role-description',

    // LinkedIn
    '.description__text',
    '.jobs-description-content',
    '.jobs-box__html-content',

    // ARIA
    '[role="article"]',
    '[aria-label*="job description"]',
    '[aria-label*="Job Description"]',
];

// Heading patterns that typically precede job descriptions
const JD_HEADING_PATTERNS = [
    /job\s*description/i,
    /about\s*(the\s*)?(role|position|job|opportunity)/i,
    /role\s*description/i,
    /what\s*you('ll| will)\s*(do|be doing)/i,
    /responsibilities/i,
    /requirements/i,
    /qualifications/i,
    /about\s*us/i,
    /the\s*role/i,
    /overview/i,
];

/**
 * Main function: Scrape job description from the current page.
 * Returns a cleaned string of the job description text.
 */
export function scrapeJobDescription(): string {
    const strategies = [
        scrapeBySelectors,
        scrapeByHeadings,
        scrapeByStructuredData,
        scrapeByMainContent,
    ];

    let best_text = '';
    let best_score = 0;

    for (const strategy of strategies) {
        try {
            const text = strategy();
            if (text) {
                const score = scoreJDText(text);
                if (score > best_score) {
                    best_score = score;
                    best_text = text;
                }
            }
        } catch (e) {
            // Continue to next strategy
        }
    }

    return cleanText(best_text).slice(0, 5000); // Cap at 5000 chars for API
}

/**
 * Strategy 1: Use known CSS selectors for JD containers
 */
function scrapeBySelectors(): string {
    for (const selector of JD_SELECTORS) {
        try {
            const elements = document.querySelectorAll(selector);
            for (const el of Array.from(elements)) {
                const text = el.textContent || '';
                if (text.length > 100) {
                    return text;
                }
            }
        } catch (e) {
            // Invalid selector, skip
        }
    }
    return '';
}

/**
 * Strategy 2: Find JD by locating relevant headings and extracting sibling content
 */
function scrapeByHeadings(): string {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const jd_parts: string[] = [];

    for (const heading of Array.from(headings)) {
        const heading_text = (heading.textContent || '').trim();
        const is_jd_heading = JD_HEADING_PATTERNS.some(p => p.test(heading_text));

        if (is_jd_heading) {
            // Collect text from siblings until the next heading
            let sibling = heading.nextElementSibling;
            let section_text = heading_text + '\n';

            while (sibling) {
                if (/^H[1-6]$/i.test(sibling.tagName)) {
                    // Check if this next heading is also a JD heading
                    const next_text = (sibling.textContent || '').trim();
                    const is_also_jd = JD_HEADING_PATTERNS.some(p => p.test(next_text));
                    if (!is_also_jd) break;
                }

                section_text += (sibling.textContent || '') + '\n';
                sibling = sibling.nextElementSibling;
            }

            if (section_text.length > 50) {
                jd_parts.push(section_text);
            }
        }
    }

    return jd_parts.join('\n\n');
}

/**
 * Strategy 3: Extract from JSON-LD structured data (Schema.org JobPosting)
 */
function scrapeByStructuredData(): string {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');

    for (const script of Array.from(scripts)) {
        try {
            const data = JSON.parse(script.textContent || '');
            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                if (item['@type'] === 'JobPosting') {
                    const parts: string[] = [];
                    if (item.title) parts.push(`Title: ${item.title}`);
                    if (item.description) parts.push(stripHtml(item.description));
                    if (item.responsibilities) parts.push(`Responsibilities: ${stripHtml(item.responsibilities)}`);
                    if (item.qualifications) parts.push(`Qualifications: ${stripHtml(item.qualifications)}`);
                    if (item.skills) parts.push(`Skills: ${stripHtml(item.skills)}`);
                    if (item.hiringOrganization?.name) parts.push(`Company: ${item.hiringOrganization.name}`);
                    if (item.jobLocation?.address) {
                        const addr = item.jobLocation.address;
                        parts.push(`Location: ${addr.addressLocality || ''} ${addr.addressRegion || ''} ${addr.addressCountry || ''}`);
                    }
                    return parts.join('\n\n');
                }
            }
        } catch (e) {
            // Invalid JSON, skip
        }
    }

    return '';
}

/**
 * Strategy 4: Fallback - Extract from <main> or largest text block
 */
function scrapeByMainContent(): string {
    // Try <main> element first
    const main_el = document.querySelector('main, [role="main"]');
    if (main_el) {
        const text = main_el.textContent || '';
        if (text.length > 200) return text;
    }

    // Fallback: find the largest text block on the page
    const candidates = document.querySelectorAll('article, .content, .main, .page-content, [class*="content"]');
    let best = '';

    for (const el of Array.from(candidates)) {
        const text = el.textContent || '';
        if (text.length > best.length && text.length > 200) {
            best = text;
        }
    }

    return best;
}

/**
 * Score how likely a text block is to be a job description
 */
function scoreJDText(text: string): number {
    if (!text || text.length < 50) return 0;

    let score = Math.min(text.length / 100, 10); // Length bonus, capped

    const lower = text.toLowerCase();

    // Positive signals
    const positive_keywords = [
        'responsibilities', 'requirements', 'qualifications',
        'experience', 'skills', 'education', 'about the role',
        'what you will do', 'who you are', 'apply', 'salary',
        'benefits', 'compensation', 'team', 'opportunity',
        'job description', 'role', 'position',
    ];

    for (const kw of positive_keywords) {
        if (lower.includes(kw)) score += 2;
    }

    // Negative signals (probably not a JD)
    const negative_keywords = [
        'sign in', 'log in', 'register', 'cookie',
        'privacy policy', 'terms of service', 'password',
    ];

    for (const kw of negative_keywords) {
        if (lower.includes(kw)) score -= 3;
    }

    return score;
}

/**
 * Strip HTML tags from a string
 */
function stripHtml(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || '';
}

/**
 * Clean and normalize text
 */
function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')       // Collapse whitespace
        .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
        .replace(/\t/g, ' ')        // Replace tabs
        .trim();
}

/**
 * Extract company name from page
 */
export function scrapeCompanyName(): string {
    // Try structured data
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
        try {
            const data = JSON.parse(script.textContent || '');
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (item['@type'] === 'JobPosting' && item.hiringOrganization?.name) {
                    return item.hiringOrganization.name;
                }
            }
        } catch (e) { /* skip */ }
    }

    // Try meta tags
    const og_site = document.querySelector('meta[property="og:site_name"]');
    if (og_site) return og_site.getAttribute('content') || '';

    // Try common selectors
    const company_selectors = [
        '[class*="company-name"]', '[class*="companyName"]',
        '[class*="employer"]', '[data-company]',
    ];
    for (const sel of company_selectors) {
        const el = document.querySelector(sel);
        if (el && el.textContent?.trim()) return el.textContent.trim();
    }

    return '';
}

/**
 * Extract job title from page
 */
export function scrapeJobTitle(): string {
    // Try structured data
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
        try {
            const data = JSON.parse(script.textContent || '');
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (item['@type'] === 'JobPosting' && item.title) {
                    return item.title;
                }
            }
        } catch (e) { /* skip */ }
    }

    // Try OG title
    const og_title = document.querySelector('meta[property="og:title"]');
    if (og_title) return og_title.getAttribute('content') || '';

    // Try h1
    const h1 = document.querySelector('h1');
    if (h1 && h1.textContent?.trim()) return h1.textContent.trim();

    return document.title || '';
}

