import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface FieldMetadata {
  fieldId: string;
  name: string;
  id: string;
  type: string;
  placeholder: string;
  label: string;
  ariaLabel: string;
}

interface FieldMapping {
  fieldId: string;
  canonicalField: string | null;
  confidence: number;
  reason: string;
}

@Injectable()
export class LLMService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
  }

  /**
   * Initialize or get a model using the user-provided API key (from extension header).
   * Falls back to the server-level key if available.
   */
  private getModel(userApiKey?: string) {
    if (userApiKey) {
      const genAI = new GoogleGenerativeAI(userApiKey);
      return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
    return this.model;
  }

  async mapFields(fields: FieldMetadata[], userApiKey?: string): Promise<FieldMapping[]> {
    const model = this.getModel(userApiKey);

    if (!model) {
      // No server key and no user key — fallback to heuristics
      return this.fallbackMapping(fields);
    }

    const prompt = this.buildMappingPrompt(fields);

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const mappings = this.parseJSONResponse(text);
      return mappings;
    } catch (error) {
      console.error("[LLM] Field mapping failed:", error);
      return this.fallbackMapping(fields);
    }
  }

  private buildMappingPrompt(fields: FieldMetadata[]): string {
    const canonicalFields = [
      "fullName",
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "address",
      "currentLocation",
      "preferredLocation",
      "location",
      "noticePeriod",
      "currentCtc",
      "expectedCtc",
      "desiredSalary",
      "experience",
      "skills",
      "currentCompany",
      "company",
      "jobTitle",
      "education",
      "institution",
      "linkedinUrl",
      "portfolioUrl",
      "githubUrl",
      "coverLetter",
      "workHistory",
      "resume",
    ];

    return `You are a form field mapping expert for job applications in India.

Canonical fields available:
${canonicalFields.map((f) => `- ${f}`).join("\n")}

Form fields to map:
${fields
  .map(
    (f, i) => `${i + 1}. ID: ${f.fieldId}
   - name: "${f.name}"
   - id: "${f.id}"
   - type: "${f.type}"
   - placeholder: "${f.placeholder}"
   - label: "${f.label}"
   - aria-label: "${f.ariaLabel}"`
  )
  .join("\n\n")}

Instructions:
1. For each field, determine which canonical field it maps to
2. If no good match, set canonicalField to null
3. Provide confidence score (0.0 to 1.0)
4. Give brief reason for mapping

Return ONLY valid JSON array (no markdown, no extra text):
[
  {
    "fieldId": "field_0",
    "canonicalField": "fullName",
    "confidence": 0.95,
    "reason": "Label says 'Full Name'"
  },
  ...
]`;
  }

  private parseJSONResponse(text: string): FieldMapping[] {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith("```")) {
        cleanText = cleanText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      }

      const mappings = JSON.parse(cleanText);
      return mappings;
    } catch (error) {
      console.error("[LLM] Failed to parse JSON:", text);
      return [];
    }
  }

  private fallbackMapping(fields: FieldMetadata[]): FieldMapping[] {
    // Simple heuristic-based mapping as fallback
    const patterns: Record<string, RegExp[]> = {
      fullName: [/name/i, /full[\s_-]?name/i],
      firstName: [/first[\s_-]?name/i, /fname/i],
      lastName: [/last[\s_-]?name/i, /lname/i],
      email: [/email/i, /e-mail/i],
      phoneNumber: [/phone/i, /mobile/i, /contact/i, /tel/i],
      address: [/address/i, /street/i, /line[\s_-]?\d/i, /pincode/i, /zip/i, /postal/i],
      currentLocation: [/location/i, /city/i, /current[\s_-]?location/i],
      location: [/location/i, /city/i, /town/i],
      preferredLocation: [/preferred[\s_-]?location/i],
      noticePeriod: [/notice[\s_-]?period/i, /joining/i],
      currentCtc: [/current[\s_-]?(ctc|salary|compensation)/i],
      expectedCtc: [/expected[\s_-]?(ctc|salary|compensation)/i],
      desiredSalary: [/desired[\s_-]?(ctc|salary|compensation|package)/i, /salary[\s_-]?expectations?/i],
      experience: [/experience/i, /years/i],
      skills: [/skills/i, /technologies/i],
      currentCompany: [/current[\s_-]?(company|employer|organization|organisation)/i, /most[\s_-]?recent[\s_-]?employer/i],
      company: [/company/i, /employer/i, /organization/i],
      jobTitle: [/designation/i, /position/i, /role/i, /job[\s_-]?title/i],
      education: [/education/i, /qualification/i, /degree/i],
      institution: [/college/i, /university/i, /institution/i],
      linkedinUrl: [/linkedin/i],
      portfolioUrl: [/portfolio/i, /personal[\s_-]?website/i, /personal[\s_-]?site/i, /website/i],
      githubUrl: [/github/i],
      coverLetter: [/cover[\s_-]?letter/i, /motivation/i, /statement/i, /summary/i],
      workHistory: [/work[\s_-]?history/i, /employment[\s_-]?history/i, /experience[\s_-]?details/i, /professional[\s_-]?summary/i],
      resume: [/resume/i, /cv/i],
    };

    return fields.map((field) => {
      const searchText = `${field.name} ${field.id} ${field.placeholder} ${field.label} ${field.ariaLabel}`.toLowerCase();

      for (const [canonicalField, regexList] of Object.entries(patterns)) {
        for (const regex of regexList) {
          if (regex.test(searchText)) {
            return {
              fieldId: field.fieldId,
              canonicalField,
              confidence: 0.7,
              reason: `Heuristic match: ${regex.toString()}`,
            };
          }
        }
      }

      return {
        fieldId: field.fieldId,
        canonicalField: null,
        confidence: 0.0,
        reason: "No match found",
      };
    });
  }
}
