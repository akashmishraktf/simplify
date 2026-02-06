import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface FormFieldContext {
  field_id: string;
  element_type: "input" | "select" | "textarea" | "radio" | "checkbox";
  input_type?: string; // text, email, tel, number, etc.
  name: string;
  id: string;
  placeholder: string;
  label: string;
  aria_label: string;
  required: boolean;
  // For select/radio/checkbox
  options?: { value: string; text: string; selected?: boolean }[];
  // For grouped fields (radio groups, checkbox groups)
  group_name?: string;
  // Current value if any
  current_value?: string;
  // Context clues
  surrounding_text?: string;
  section_title?: string;
}

export interface AgentFillResult {
  field_id: string;
  action: "fill" | "select" | "check" | "skip";
  value: string | string[] | boolean;
  confidence: number;
  reasoning: string;
}

export interface UserProfile {
  first_name?: string;
  last_name?: string;
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  current_location?: string;
  preferred_location?: string;
  current_company?: string;
  job_title?: string;
  notice_period_days?: number;
  current_ctc?: string;
  expected_ctc?: string;
  desired_salary?: string;
  skills?: string[];
  employment_history?: {
    company: string;
    title: string;
    start_date: string;
    end_date?: string;
    current: boolean;
    description?: string;
  }[];
  education?: {
    institution: string;
    degree: string;
    field_of_study?: string;
    start_year?: number;
    end_year?: number;
  }[];
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  cover_letter?: string;
  work_history?: string;
  total_experience_years?: number;
  // Demographic & Legal fields
  gender?: string;
  date_of_birth?: string;
  nationality?: string;
  citizenship?: string;
  work_authorization?: string;
  requires_sponsorship?: boolean;
  visa_status?: string;
  ethnicity?: string;
  race?: string;
  veteran_status?: string;
  disability_status?: string;
  // Availability & Preferences
  availability_date?: string;
  willing_to_relocate?: boolean;
  willing_to_travel?: boolean;
  travel_percentage?: string;
  work_preference?: string;
  languages?: { language: string; proficiency: string }[];
  hear_about_us?: string;
}

@Injectable()
export class AgentService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const api_key = this.configService.get<string>("GEMINI_API_KEY");

    if (api_key) {
      this.genAI = new GoogleGenerativeAI(api_key);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      console.log("[Agent] Server-level Gemini API key configured");
    } else {
      console.log("[Agent] No server-level GEMINI_API_KEY. Will use user-provided key from extension.");
    }
  }

  async fillForm(
    fields: FormFieldContext[],
    profile: UserProfile,
    page_url: string,
    apiKey?: string
  ): Promise<AgentFillResult[]> {
    // User-provided key always takes priority over server key
    let modelToUse = this.model;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        modelToUse = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      } catch (e) {
        console.error("[Agent] Invalid user-provided API key:", e);
      }
    }

    if (!modelToUse) {
      console.warn("[Agent] No LLM configured, using heuristic fallback");
      return this.heuristicFill(fields, profile);
    }

    const prompt = this.buildAgentPrompt(fields, profile, page_url);

    try {
      const result = await modelToUse.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const results = this.parseAgentResponse(text);

      // Validate and enhance results with fallbacks
      return this.validateAndEnhance(results, fields, profile);
    } catch (error) {
      console.error("[Agent] LLM fill failed:", error);
      return this.heuristicFill(fields, profile);
    }
  }

  private buildAgentPrompt(
    fields: FormFieldContext[],
    profile: UserProfile,
    page_url: string
  ): string {
    const profile_summary = this.buildProfileSummary(profile);
    const fields_description = this.buildFieldsDescription(fields);

    return `You are an intelligent job application autofill agent. Your job is to analyze form fields and determine the BEST value to fill from the user's profile.

## User Profile
${profile_summary}

## Page URL
${page_url}

## Form Fields to Fill
${fields_description}

## Instructions

For EACH field, determine the best action:

1. **Text inputs**: Provide the exact value to fill
2. **Dropdowns (select)**: Choose the BEST matching option from the available options. Return the exact option VALUE (not text).
3. **Radio buttons**: Select the most appropriate option. Return the VALUE of the option to select.
4. **Checkboxes**: Return true/false for whether to check it, or for checkbox groups return array of values to check.
5. **Textareas**: Provide appropriate text content.

### Special Handling

- **Split fields**: If you see "Address Line 1" and "Address Line 2", split the address appropriately.
- **Name fields**: If you see "First Name" and "Last Name" separately, use the appropriate parts.
- **Experience fields**: Calculate years of experience from employment history if needed.
- **Yes/No questions**: Analyze the question and answer appropriately based on profile context.
- **Notice period**: If dropdown has options like "Immediate", "15 days", "30 days", etc., pick the closest match.
- **Location dropdowns**: Find the closest matching city/location from options.
- **Salary fields**: Use current_ctc or expected_ctc as appropriate. Handle LPA/lakhs format.

### EEOC/Demographic Questions (IMPORTANT)

For demographic questions that DON'T affect candidature, use these smart defaults if not in profile:

- **Gender**: Use profile value if available, otherwise select "Prefer not to say" or "Decline to self-identify" if available
- **Ethnicity/Race**: Use profile value if available, otherwise select "Prefer not to say" or "Decline to self-identify"  
- **Veteran Status**: Use profile value if available, otherwise select "I am not a veteran" or "Prefer not to say"
- **Disability**: Use profile value if available, otherwise select "Prefer not to say" or "I don't wish to answer"
- **LGBTQ+**: Always select "Prefer not to say" or "Decline to answer"

For questions that DO affect candidature, use profile data or smart defaults:

- **Work Authorization**: If not in profile but location is India, assume "Authorized to work" or "Indian Citizen"
- **Visa Sponsorship**: If not in profile, select "No" (doesn't require sponsorship) to maximize chances
- **Willing to Relocate**: If preferred_location differs from current_location, answer "Yes"
- **Willing to Travel**: Default to "Yes" or "Up to 25%" if not specified
- **Remote/Hybrid preference**: Use profile value, or select "Flexible" / "Hybrid" as default
- **How did you hear about us**: Select "Job Board", "LinkedIn", "Company Website" or similar neutral option
- **Available start date**: Use availability_date from profile, or answer based on notice_period_days, or "Immediately" / "2 weeks"

### Confidence Scoring
- 1.0: Perfect match, data directly available
- 0.8-0.9: Good match with minor inference
- 0.6-0.7: Reasonable guess based on context
- 0.3-0.5: Low confidence, best effort guess
- 0.0: Cannot determine, skip the field

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "field_id": "field_0",
    "action": "fill",
    "value": "John Doe",
    "confidence": 0.95,
    "reasoning": "Full name directly from profile"
  },
  {
    "field_id": "field_1",
    "action": "select",
    "value": "bangalore",
    "confidence": 0.9,
    "reasoning": "Selected Bangalore as closest match to user's current location"
  },
  {
    "field_id": "field_2",
    "action": "check",
    "value": true,
    "confidence": 0.8,
    "reasoning": "User is willing to relocate based on preferred locations"
  },
  {
    "field_id": "field_3",
    "action": "skip",
    "value": "",
    "confidence": 0.0,
    "reasoning": "No relevant data in profile for this question"
  }
]`;
  }

  private buildProfileSummary(profile: UserProfile): string {
    const parts: string[] = [];

    if (profile.full_name)
      parts.push(`- Full Name: ${profile.full_name}`);
    if (profile.first_name)
      parts.push(`- First Name: ${profile.first_name}`);
    if (profile.last_name)
      parts.push(`- Last Name: ${profile.last_name}`);
    if (profile.email)
      parts.push(`- Email: ${profile.email}`);
    if (profile.phone_number)
      parts.push(`- Phone: ${profile.phone_number}`);
    if (profile.address)
      parts.push(`- Address: ${profile.address}`);
    if (profile.current_location)
      parts.push(`- Current Location: ${profile.current_location}`);
    if (profile.preferred_location)
      parts.push(`- Preferred Location: ${profile.preferred_location}`);
    if (profile.current_company)
      parts.push(`- Current Company: ${profile.current_company}`);
    if (profile.job_title)
      parts.push(`- Job Title: ${profile.job_title}`);
    if (profile.notice_period_days !== undefined)
      parts.push(`- Notice Period: ${profile.notice_period_days} days`);
    if (profile.current_ctc)
      parts.push(`- Current CTC: ${profile.current_ctc}`);
    if (profile.expected_ctc)
      parts.push(`- Expected CTC: ${profile.expected_ctc}`);
    if (profile.desired_salary)
      parts.push(`- Desired Salary: ${profile.desired_salary}`);
    if (profile.total_experience_years !== undefined)
      parts.push(`- Total Experience: ${profile.total_experience_years} years`);
    if (profile.skills && profile.skills.length > 0)
      parts.push(`- Skills: ${profile.skills.join(", ")}`);
    if (profile.linkedin_url)
      parts.push(`- LinkedIn: ${profile.linkedin_url}`);
    if (profile.portfolio_url)
      parts.push(`- Portfolio: ${profile.portfolio_url}`);
    if (profile.github_url)
      parts.push(`- GitHub: ${profile.github_url}`);

    if (profile.employment_history && profile.employment_history.length > 0) {
      parts.push(`- Employment History:`);
      profile.employment_history.forEach((job, i) => {
        const duration = job.current
          ? `${job.start_date} - Present`
          : `${job.start_date} - ${job.end_date || "N/A"}`;
        parts.push(`  ${i + 1}. ${job.title} at ${job.company} (${duration})`);
      });
    }

    if (profile.education && profile.education.length > 0) {
      parts.push(`- Education:`);
      profile.education.forEach((edu, i) => {
        const years =
          edu.start_year && edu.end_year
            ? `(${edu.start_year}-${edu.end_year})`
            : "";
        parts.push(
          `  ${i + 1}. ${edu.degree}${edu.field_of_study ? " in " + edu.field_of_study : ""} from ${edu.institution} ${years}`
        );
      });
    }

    if (profile.cover_letter)
      parts.push(`- Cover Letter available: Yes (${profile.cover_letter.length} chars)`);
    if (profile.work_history)
      parts.push(`- Work History Summary available: Yes`);

    // Demographic fields
    if (profile.gender)
      parts.push(`- Gender: ${profile.gender}`);
    if (profile.date_of_birth)
      parts.push(`- Date of Birth: ${profile.date_of_birth}`);
    if (profile.nationality)
      parts.push(`- Nationality: ${profile.nationality}`);
    if (profile.citizenship)
      parts.push(`- Citizenship: ${profile.citizenship}`);
    if (profile.work_authorization)
      parts.push(`- Work Authorization: ${profile.work_authorization}`);
    if (profile.requires_sponsorship !== undefined)
      parts.push(`- Requires Visa Sponsorship: ${profile.requires_sponsorship ? "Yes" : "No"}`);
    if (profile.visa_status)
      parts.push(`- Visa Status: ${profile.visa_status}`);
    if (profile.ethnicity)
      parts.push(`- Ethnicity (EEOC): ${profile.ethnicity}`);
    if (profile.race)
      parts.push(`- Race (EEOC): ${profile.race}`);
    if (profile.veteran_status)
      parts.push(`- Veteran Status: ${profile.veteran_status}`);
    if (profile.disability_status)
      parts.push(`- Disability Status: ${profile.disability_status}`);

    // Availability & Preferences
    if (profile.availability_date)
      parts.push(`- Available to Start: ${profile.availability_date}`);
    if (profile.willing_to_relocate !== undefined)
      parts.push(`- Willing to Relocate: ${profile.willing_to_relocate ? "Yes" : "No"}`);
    if (profile.willing_to_travel !== undefined)
      parts.push(`- Willing to Travel: ${profile.willing_to_travel ? "Yes" : "No"}`);
    if (profile.travel_percentage)
      parts.push(`- Travel Percentage: ${profile.travel_percentage}`);
    if (profile.work_preference)
      parts.push(`- Work Preference: ${profile.work_preference}`);
    if (profile.languages && profile.languages.length > 0)
      parts.push(`- Languages: ${profile.languages.map(l => `${l.language} (${l.proficiency})`).join(", ")}`);

    return parts.join("\n");
  }

  private buildFieldsDescription(fields: FormFieldContext[]): string {
    return fields
      .map((field, index) => {
        let desc = `### Field ${index}: ${field.field_id}
- Type: ${field.element_type}${field.input_type ? ` (${field.input_type})` : ""}
- Name: "${field.name}"
- ID: "${field.id}"
- Label: "${field.label}"
- Placeholder: "${field.placeholder}"
- Required: ${field.required}`;

        if (field.surrounding_text) {
          desc += `\n- Context: "${field.surrounding_text}"`;
        }

        if (field.section_title) {
          desc += `\n- Section: "${field.section_title}"`;
        }

        if (field.options && field.options.length > 0) {
          desc += `\n- Options:`;
          field.options.forEach((opt) => {
            desc += `\n  * value="${opt.value}" text="${opt.text}"${opt.selected ? " (currently selected)" : ""}`;
          });
        }

        if (field.current_value) {
          desc += `\n- Current Value: "${field.current_value}"`;
        }

        return desc;
      })
      .join("\n\n");
  }

  private parseAgentResponse(text: string): AgentFillResult[] {
    try {
      let clean_text = text.trim();
      // Remove markdown code blocks
      if (clean_text.startsWith("```")) {
        clean_text = clean_text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");
      }

      const results = JSON.parse(clean_text);
      return results;
    } catch (error) {
      console.error("[Agent] Failed to parse response:", text);
      return [];
    }
  }

  private validateAndEnhance(
    results: AgentFillResult[],
    fields: FormFieldContext[],
    profile: UserProfile
  ): AgentFillResult[] {
    const field_map = new Map(fields.map((f) => [f.field_id, f]));
    const enhanced: AgentFillResult[] = [];

    // First, add all LLM results
    for (const result of results) {
      const field = field_map.get(result.field_id);
      if (!field) continue;

      // Validate select options
      if (result.action === "select" && field.options) {
        const value_exists = field.options.some(
          (opt) =>
            opt.value === result.value ||
            opt.text.toLowerCase() === String(result.value).toLowerCase()
        );
        if (!value_exists) {
          // Try to find closest match
          const closest = this.findClosestOption(
            String(result.value),
            field.options
          );
          if (closest) {
            result.value = closest.value;
            result.confidence = Math.min(result.confidence, 0.7);
            result.reasoning += ` (Matched to closest option: ${closest.text})`;
          }
        }
      }

      enhanced.push(result);
      field_map.delete(result.field_id);
    }

    // Fill any missing fields with heuristic fallback
    for (const [field_id, field] of field_map) {
      const fallback = this.heuristicFillSingle(field, profile);
      if (fallback) {
        enhanced.push(fallback);
      }
    }

    return enhanced;
  }

  private findClosestOption(
    value: string,
    options: { value: string; text: string }[]
  ): { value: string; text: string } | null {
    const search = value.toLowerCase();

    // Exact match
    for (const opt of options) {
      if (
        opt.value.toLowerCase() === search ||
        opt.text.toLowerCase() === search
      ) {
        return opt;
      }
    }

    // Contains match
    for (const opt of options) {
      if (
        opt.value.toLowerCase().includes(search) ||
        opt.text.toLowerCase().includes(search) ||
        search.includes(opt.value.toLowerCase()) ||
        search.includes(opt.text.toLowerCase())
      ) {
        return opt;
      }
    }

    // Fuzzy match - check if words overlap
    const search_words = search.split(/\s+/);
    let best_match: { value: string; text: string } | null = null;
    let best_score = 0;

    for (const opt of options) {
      const opt_text = opt.text.toLowerCase();
      const opt_words = opt_text.split(/\s+/);

      let score = 0;
      for (const word of search_words) {
        if (word.length > 2 && opt_text.includes(word)) {
          score += word.length;
        }
      }
      for (const word of opt_words) {
        if (word.length > 2 && search.includes(word)) {
          score += word.length;
        }
      }

      if (score > best_score) {
        best_score = score;
        best_match = opt;
      }
    }

    return best_score > 3 ? best_match : null;
  }

  private heuristicFill(
    fields: FormFieldContext[],
    profile: UserProfile
  ): AgentFillResult[] {
    return fields
      .map((field) => this.heuristicFillSingle(field, profile))
      .filter((r): r is AgentFillResult => r !== null);
  }

  private heuristicFillSingle(
    field: FormFieldContext,
    profile: UserProfile
  ): AgentFillResult | null {
    const search_text =
      `${field.name} ${field.id} ${field.placeholder} ${field.label} ${field.aria_label}`.toLowerCase();

    let value: string | boolean | string[] = "";
    let action: "fill" | "select" | "check" | "skip" = "fill";
    let confidence = 0;
    let reasoning = "";

    // Name fields
    if (/first[\s_-]?name|fname|given[\s_-]?name/i.test(search_text)) {
      value = profile.first_name || this.getFirstName(profile) || "";
      confidence = value ? 0.9 : 0;
      reasoning = "First name field";
    } else if (/last[\s_-]?name|lname|surname|family[\s_-]?name/i.test(search_text)) {
      value = profile.last_name || this.getLastName(profile) || "";
      confidence = value ? 0.9 : 0;
      reasoning = "Last name field";
    } else if (/full[\s_-]?name|candidate[\s_-]?name|^name$/i.test(search_text)) {
      value = profile.full_name || this.getFullName(profile) || "";
      confidence = value ? 0.9 : 0;
      reasoning = "Full name field";
    }
    // Contact fields
    else if (/email|e-mail/i.test(search_text)) {
      value = profile.email || "";
      confidence = value ? 0.95 : 0;
      reasoning = "Email field";
    } else if (/phone|mobile|contact|cell|tel/i.test(search_text)) {
      value = profile.phone_number || "";
      confidence = value ? 0.9 : 0;
      reasoning = "Phone field";
    }
    // Address fields
    else if (/address[\s_-]?line[\s_-]?1|street[\s_-]?address/i.test(search_text)) {
      value = this.getAddressLine1(profile.address) || "";
      confidence = value ? 0.8 : 0;
      reasoning = "Address line 1";
    } else if (/address[\s_-]?line[\s_-]?2/i.test(search_text)) {
      value = this.getAddressLine2(profile.address) || "";
      confidence = value ? 0.7 : 0;
      reasoning = "Address line 2";
    } else if (/address/i.test(search_text)) {
      value = profile.address || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Address field";
    }
    // Location fields
    else if (/current[\s_-]?(location|city)/i.test(search_text)) {
      value = profile.current_location || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Current location";
    } else if (/preferred[\s_-]?(location|city)/i.test(search_text)) {
      value = profile.preferred_location || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Preferred location";
    } else if (/location|city/i.test(search_text)) {
      value = profile.current_location || profile.preferred_location || "";
      confidence = value ? 0.7 : 0;
      reasoning = "Location field";
    }
    // Employment fields
    else if (/current[\s_-]?(company|employer|organization)/i.test(search_text)) {
      value = profile.current_company || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Current company";
    } else if (/company|employer|organization/i.test(search_text)) {
      value = profile.current_company || "";
      confidence = value ? 0.7 : 0;
      reasoning = "Company field";
    } else if (/designation|position|role|job[\s_-]?title|title/i.test(search_text)) {
      value = profile.job_title || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Job title field";
    }
    // Notice period
    else if (/notice[\s_-]?period/i.test(search_text)) {
      if (field.element_type === "select" && field.options) {
        const match = this.matchNoticePeriod(
          profile.notice_period_days,
          field.options
        );
        if (match) {
          value = match.value;
          action = "select";
          confidence = 0.8;
          reasoning = `Notice period: ${profile.notice_period_days} days`;
        }
      } else {
        value = profile.notice_period_days?.toString() || "";
        confidence = value ? 0.8 : 0;
        reasoning = "Notice period days";
      }
    }
    // Salary fields
    else if (/current[\s_-]?(ctc|salary|compensation|package)/i.test(search_text)) {
      value = profile.current_ctc || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Current CTC";
    } else if (/expected[\s_-]?(ctc|salary|compensation|package)/i.test(search_text)) {
      value = profile.expected_ctc || profile.desired_salary || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Expected CTC";
    } else if (/desired[\s_-]?(salary|ctc)/i.test(search_text)) {
      value = profile.desired_salary || profile.expected_ctc || "";
      confidence = value ? 0.8 : 0;
      reasoning = "Desired salary";
    }
    // Experience
    else if (/experience|years[\s_-]?of[\s_-]?experience/i.test(search_text)) {
      const exp = profile.total_experience_years;
      if (field.element_type === "select" && field.options) {
        const match = this.matchExperience(exp, field.options);
        if (match) {
          value = match.value;
          action = "select";
          confidence = 0.8;
          reasoning = `Experience: ${exp} years`;
        }
      } else {
        value = exp?.toString() || "";
        confidence = value ? 0.8 : 0;
        reasoning = "Experience years";
      }
    }
    // Skills
    else if (/skills|technologies|tech[\s_-]?stack/i.test(search_text)) {
      value = profile.skills?.join(", ") || "";
      confidence = value ? 0.85 : 0;
      reasoning = "Skills field";
    }
    // Education
    else if (/education|qualification|degree/i.test(search_text)) {
      const edu = profile.education?.[0];
      value = edu?.degree || "";
      confidence = value ? 0.75 : 0;
      reasoning = "Education/degree field";
    } else if (/college|university|institution/i.test(search_text)) {
      const edu = profile.education?.[0];
      value = edu?.institution || "";
      confidence = value ? 0.75 : 0;
      reasoning = "Institution field";
    }
    // URLs
    else if (/linkedin/i.test(search_text)) {
      value = profile.linkedin_url || "";
      confidence = value ? 0.9 : 0;
      reasoning = "LinkedIn URL";
    } else if (/portfolio|personal[\s_-]?(website|site)/i.test(search_text)) {
      value = profile.portfolio_url || "";
      confidence = value ? 0.9 : 0;
      reasoning = "Portfolio URL";
    } else if (/github/i.test(search_text)) {
      value = profile.github_url || "";
      confidence = value ? 0.9 : 0;
      reasoning = "GitHub URL";
    }
    // Cover letter
    else if (/cover[\s_-]?letter|motivation|statement/i.test(search_text)) {
      value = profile.cover_letter || "";
      confidence = value ? 0.8 : 0;
      reasoning = "Cover letter";
    }
    // Work history
    else if (/work[\s_-]?history|employment[\s_-]?history|experience[\s_-]?details/i.test(search_text)) {
      value = profile.work_history || this.buildWorkHistory(profile) || "";
      confidence = value ? 0.75 : 0;
      reasoning = "Work history";
    }

    // Handle dropdowns with location/city options
    if (field.element_type === "select" && field.options && !value && confidence === 0) {
      // Try to match location
      if (/location|city|state|country/i.test(search_text)) {
        const location = profile.current_location || profile.preferred_location;
        if (location) {
          const match = this.findClosestOption(location, field.options);
          if (match) {
            value = match.value;
            action = "select";
            confidence = 0.7;
            reasoning = `Location dropdown: matched ${location}`;
          }
        }
      }
    }

    if (!value || confidence === 0) {
      return null;
    }

    return {
      field_id: field.field_id,
      action: field.element_type === "select" ? "select" : action,
      value,
      confidence,
      reasoning,
    };
  }

  // Helper methods
  private getFirstName(profile: UserProfile): string {
    if (profile.first_name) return profile.first_name;
    if (profile.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      return parts[0] || "";
    }
    return "";
  }

  private getLastName(profile: UserProfile): string {
    if (profile.last_name) return profile.last_name;
    if (profile.full_name) {
      const parts = profile.full_name.trim().split(/\s+/);
      return parts.length > 1 ? parts[parts.length - 1] : parts[0] || "";
    }
    return "";
  }

  private getFullName(profile: UserProfile): string {
    if (profile.full_name) return profile.full_name;
    return [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  }

  private getAddressLine1(address?: string): string {
    if (!address) return "";
    const lines = address.split(/[,\n]/);
    return lines[0]?.trim() || "";
  }

  private getAddressLine2(address?: string): string {
    if (!address) return "";
    const lines = address.split(/[,\n]/);
    return lines.slice(1).join(", ").trim() || "";
  }

  private matchNoticePeriod(
    days: number | undefined,
    options: { value: string; text: string }[]
  ): { value: string; text: string } | null {
    if (days === undefined) return null;

    // Common patterns
    const immediate_patterns = /immediate|0|available|now/i;
    const fifteen_patterns = /15|two[\s_-]?week/i;
    const thirty_patterns = /30|one[\s_-]?month|1[\s_-]?month/i;
    const sixty_patterns = /60|two[\s_-]?month|2[\s_-]?month/i;
    const ninety_patterns = /90|three[\s_-]?month|3[\s_-]?month/i;

    let target_pattern: RegExp;
    if (days <= 7) target_pattern = immediate_patterns;
    else if (days <= 20) target_pattern = fifteen_patterns;
    else if (days <= 45) target_pattern = thirty_patterns;
    else if (days <= 75) target_pattern = sixty_patterns;
    else target_pattern = ninety_patterns;

    for (const opt of options) {
      if (target_pattern.test(opt.text) || target_pattern.test(opt.value)) {
        return opt;
      }
    }

    // Try numeric match
    for (const opt of options) {
      const num_match = opt.text.match(/(\d+)/);
      if (num_match) {
        const opt_days = parseInt(num_match[1]);
        if (Math.abs(opt_days - days) <= 15) {
          return opt;
        }
      }
    }

    return null;
  }

  private matchExperience(
    years: number | undefined,
    options: { value: string; text: string }[]
  ): { value: string; text: string } | null {
    if (years === undefined) return null;

    // Look for range matches like "3-5 years" or "5+ years"
    for (const opt of options) {
      const range_match = opt.text.match(/(\d+)\s*-\s*(\d+)/);
      if (range_match) {
        const min_val = parseInt(range_match[1]);
        const max_val = parseInt(range_match[2]);
        if (years >= min_val && years <= max_val) {
          return opt;
        }
      }

      const plus_match = opt.text.match(/(\d+)\+/);
      if (plus_match) {
        const min_val = parseInt(plus_match[1]);
        if (years >= min_val) {
          return opt;
        }
      }

      const exact_match = opt.text.match(/^(\d+)\s*year/i);
      if (exact_match) {
        const opt_years = parseInt(exact_match[1]);
        if (Math.abs(opt_years - years) <= 1) {
          return opt;
        }
      }
    }

    return null;
  }

  private buildWorkHistory(profile: UserProfile): string {
    if (!profile.employment_history || profile.employment_history.length === 0) {
      return "";
    }

    return profile.employment_history
      .map((job) => {
        const duration = job.current
          ? `${job.start_date} - Present`
          : `${job.start_date} - ${job.end_date || "N/A"}`;
        let entry = `${job.title} at ${job.company} (${duration})`;
        if (job.description) {
          entry += `\n${job.description}`;
        }
        return entry;
      })
      .join("\n\n");
  }

  // ========================================================================
  // Custom Question Answering
  // ========================================================================

  /**
   * Generate a contextual answer to a custom application question using AI.
   * Uses the user's profile, job description context, and the question to
   * produce a tailored response.
   */
  async generateCustomAnswer(
    question_text: string,
    profile: UserProfile,
    job_description: string,
    page_url: string,
    similar_answers: { question_text: string; answer_text: string; similarity: number }[] = [],
    apiKey?: string
  ): Promise<{ answer: string; confidence: number; reasoning: string }> {
    let model_to_use = this.model;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        model_to_use = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      } catch (e) {
        console.error("[Agent] Invalid user-provided API key:", e);
      }
    }

    if (!model_to_use) {
      return {
        answer: "",
        confidence: 0,
        reasoning: "No LLM configured",
      };
    }

    const profile_summary = this.buildProfileSummary(profile);
    const prompt = this.buildCustomAnswerPrompt(
      question_text,
      profile_summary,
      job_description,
      page_url,
      similar_answers
    );

    try {
      const result = await model_to_use.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseCustomAnswerResponse(text);
    } catch (error) {
      console.error("[Agent] Custom answer generation failed:", error);
      // If we have similar answers, return the best one as fallback
      if (similar_answers.length > 0) {
        return {
          answer: similar_answers[0].answer_text,
          confidence: similar_answers[0].similarity * 0.8,
          reasoning: "Fallback to most similar saved answer",
        };
      }
      return {
        answer: "",
        confidence: 0,
        reasoning: "Generation failed and no similar answers available",
      };
    }
  }

  private buildCustomAnswerPrompt(
    question_text: string,
    profile_summary: string,
    job_description: string,
    page_url: string,
    similar_answers: { question_text: string; answer_text: string; similarity: number }[]
  ): string {
    let prompt = `You are an expert job application assistant. Generate a compelling, authentic answer for the following application question.

## User Profile
${profile_summary}

## Application URL
${page_url}
`;

    if (job_description) {
      prompt += `
## Job Description
${job_description.slice(0, 3000)}
`;
    }

    if (similar_answers.length > 0) {
      prompt += `
## Previously Saved Answers (for reference/inspiration)
${similar_answers.map((sa, i) => `${i + 1}. Question: "${sa.question_text}"
   Answer: "${sa.answer_text.slice(0, 500)}"
   Similarity: ${(sa.similarity * 100).toFixed(0)}%`).join("\n\n")}
`;
    }

    prompt += `
## Question to Answer
"${question_text}"

## Instructions

1. Write a professional, authentic response tailored to the user's profile and the specific job.
2. If there are similar saved answers, adapt them to this specific context rather than copying verbatim.
3. Keep the tone professional but personable. Avoid generic platitudes.
4. Reference specific experiences, skills, or achievements from the user's profile when relevant.
5. If the job description mentions specific technologies, values, or requirements, weave them in naturally.
6. Keep the answer concise but substantive (typically 100-300 words for text areas, 1-2 sentences for short answers).
7. Do NOT fabricate experiences or skills the user doesn't have.

Return ONLY valid JSON (no markdown, no extra text):
{
  "answer": "Your generated answer text here",
  "confidence": 0.85,
  "reasoning": "Brief explanation of the approach taken"
}`;

    return prompt;
  }

  private parseCustomAnswerResponse(text: string): {
    answer: string;
    confidence: number;
    reasoning: string;
  } {
    try {
      let clean_text = text.trim();
      if (clean_text.startsWith("```")) {
        clean_text = clean_text
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(clean_text);
      return {
        answer: parsed.answer || "",
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || "",
      };
    } catch (error) {
      console.error("[Agent] Failed to parse custom answer response:", text);
      // Try to extract answer from raw text
      const raw_text = text.trim();
      if (raw_text.length > 10 && raw_text.length < 5000) {
        return {
          answer: raw_text,
          confidence: 0.4,
          reasoning: "Extracted from raw response (JSON parse failed)",
        };
      }
      return { answer: "", confidence: 0, reasoning: "Parse failed" };
    }
  }
}
