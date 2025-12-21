import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { LLMService } from "./llm.service";
import { AgentService, FormFieldContext, UserProfile } from "./agent.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FieldMappingCache } from "./entities/field-mapping-cache.entity";
import { UsersService } from "../users/users.service";
import * as crypto from "crypto";

@Controller("v1/mapping")
export class LLMController {
  constructor(
    private llmService: LLMService,
    private agentService: AgentService,
    private usersService: UsersService,
    @InjectRepository(FieldMappingCache)
    private mappingCacheRepository: Repository<FieldMappingCache>
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("guess")
  async guessFieldMapping(@Body() payload: any) {
    const { pageSignature, fields, url } = payload;

    // Check cache first
    const cached = await this.mappingCacheRepository.findOne({
      where: { pageSignature },
    });

    if (cached && cached.confirmationRate > 0.8) {
      console.log("[LLM] Using cached mapping for:", url);
      await this.mappingCacheRepository.update(cached.id, {
        useCount: cached.useCount + 1,
      });

      return {
        mappings: cached.mappings,
        cached: true,
        confidence: cached.confirmationRate,
      };
    }

    // Call LLM for new mapping
    console.log("[LLM] Generating new mapping for:", url);
    const mappings = await this.llmService.mapFields(fields);

    // Store in cache
    if (cached) {
      await this.mappingCacheRepository.update(cached.id, {
        mappings,
        useCount: cached.useCount + 1,
        updatedAt: new Date(),
      });
    } else {
      await this.mappingCacheRepository.save({
        pageSignature,
        url,
        mappings,
        useCount: 1,
        confirmationRate: 0.5,
      });
    }

    return {
      mappings,
      cached: false,
      confidence: 0.5,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post("confirm")
  async confirmMapping(@Body() payload: any) {
    const { pageSignature, success } = payload;

    const cached = await this.mappingCacheRepository.findOne({
      where: { pageSignature },
    });

    if (cached) {
      // Update confirmation rate using exponential moving average
      const alpha = 0.3;
      const newRate = success
        ? cached.confirmationRate * (1 - alpha) + 1 * alpha
        : cached.confirmationRate * (1 - alpha) + 0 * alpha;

      await this.mappingCacheRepository.update(cached.id, {
        confirmationRate: newRate,
      });

      return { success: true, newRate };
    }

    return { success: false };
  }

  @UseGuards(JwtAuthGuard)
  @Post("agent-fill")
  async agentFill(@Request() req: any, @Body() payload: any) {
    const { fields, url } = payload;
    const user_id = req.user.userId;
    const apiKey = req.headers['x-gemini-api-key'];

    // Get user profile
    const profile_data = await this.usersService.getProfile(user_id);
    if (!profile_data) {
      return { error: "Profile not found", results: [] };
    }

    // Calculate total experience
    let total_experience = 0;
    if (profile_data.employmentHistory && profile_data.employmentHistory.length > 0) {
      const now = new Date();
      for (const job of profile_data.employmentHistory) {
        if (!job.startDate) continue;
        const start = new Date(job.startDate);
        const end = job.current ? now : job.endDate ? new Date(job.endDate) : now;
        const months =
          (end.getFullYear() - start.getFullYear()) * 12 +
          (end.getMonth() - start.getMonth());
        total_experience += months;
      }
      total_experience = Math.round((total_experience / 12) * 10) / 10;
    }

    // Get current job info
    let job_title = "";
    if (profile_data.employmentHistory && profile_data.employmentHistory.length > 0) {
      const current_job =
        profile_data.employmentHistory.find((j: any) => j.current) ||
        profile_data.employmentHistory[0];
      job_title = current_job?.title || "";
    }

    // Transform to agent profile format
    const profile: UserProfile = {
      first_name: profile_data.firstName,
      last_name: profile_data.lastName,
      full_name: profile_data.fullName,
      email: profile_data.email,
      phone_number: profile_data.phoneNumber,
      address: profile_data.address,
      current_location: profile_data.currentLocation,
      preferred_location: profile_data.preferredLocation,
      current_company: profile_data.currentCompany,
      job_title: job_title,
      notice_period_days: profile_data.noticePeriodDays,
      current_ctc: profile_data.currentCtc,
      expected_ctc: profile_data.expectedCtc,
      desired_salary: profile_data.desiredSalary,
      skills: profile_data.skills,
      employment_history: profile_data.employmentHistory?.map((job: any) => ({
        company: job.company,
        title: job.title,
        start_date: job.startDate,
        end_date: job.endDate,
        current: job.current,
        description: job.description,
      })),
      education: profile_data.education?.map((edu: any) => ({
        institution: edu.institution,
        degree: edu.degree,
        field_of_study: edu.fieldOfStudy,
        start_year: edu.startYear,
        end_year: edu.endYear,
      })),
      linkedin_url: profile_data.linkedinUrl,
      portfolio_url: profile_data.portfolioUrl,
      github_url: profile_data.githubUrl,
      cover_letter: profile_data.coverLetter,
      work_history: profile_data.workHistory,
      total_experience_years: total_experience,
      // Demographic & Legal fields
      gender: profile_data.gender,
      date_of_birth: profile_data.dateOfBirth,
      nationality: profile_data.nationality,
      citizenship: profile_data.citizenship,
      work_authorization: profile_data.workAuthorization,
      requires_sponsorship: profile_data.requiresSponsorship,
      visa_status: profile_data.visaStatus,
      ethnicity: profile_data.ethnicity,
      race: profile_data.race,
      veteran_status: profile_data.veteranStatus,
      disability_status: profile_data.disabilityStatus,
      // Availability & Preferences
      availability_date: profile_data.availabilityDate,
      willing_to_relocate: profile_data.willingToRelocate,
      willing_to_travel: profile_data.willingToTravel,
      travel_percentage: profile_data.travelPercentage,
      work_preference: profile_data.workPreference,
      languages: profile_data.languages,
      hear_about_us: profile_data.hearAboutUs,
    };

    console.log("[Agent] Processing form fill for:", url);
    console.log("[Agent] Fields count:", fields.length);

    const results = await this.agentService.fillForm(fields, profile, url, apiKey);

    console.log("[Agent] Fill results:", results.length);

    return { results };
  }
}
