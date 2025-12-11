import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true, type: "text" })
  address: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  currentLocation: string;

  @Column({ nullable: true })
  preferredLocation: string;

  @Column({ nullable: true })
  currentCompany: string;

  @Column({ type: "jsonb", nullable: true })
  locations: any;

  @Column({ nullable: true })
  noticePeriodDays: number;

  @Column({ nullable: true })
  currentCtc: string;

  @Column({ nullable: true })
  expectedCtc: string;

  @Column({ nullable: true })
  desiredSalary: string;

  @Column({ type: "jsonb", nullable: true, default: [] })
  skills: string[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  employmentHistory: any[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  education: any[];

  @Column({ nullable: true })
  linkedinUrl: string;

  @Column({ nullable: true })
  portfolioUrl: string;

  @Column({ nullable: true })
  githubUrl: string;

  @Column({ type: "text", nullable: true })
  coverLetter: string;

  @Column({ type: "text", nullable: true })
  workHistory: string;

  // ===== Demographic & Legal Fields =====
  
  @Column({ nullable: true })
  gender: string; // Male, Female, Non-binary, Prefer not to say

  @Column({ nullable: true })
  dateOfBirth: string; // YYYY-MM-DD format

  @Column({ nullable: true })
  nationality: string;

  @Column({ nullable: true })
  citizenship: string;

  // Work Authorization
  @Column({ nullable: true })
  workAuthorization: string; // Citizen, Permanent Resident, Work Visa, etc.

  @Column({ nullable: true, default: false })
  requiresSponsorship: boolean;

  @Column({ nullable: true })
  visaStatus: string; // H1B, L1, OPT, etc.

  // US EEOC / Diversity fields (optional, for compliance)
  @Column({ nullable: true })
  ethnicity: string; // Hispanic/Latino, Not Hispanic/Latino, Prefer not to say

  @Column({ nullable: true })
  race: string; // Asian, White, Black, etc.

  @Column({ nullable: true })
  veteranStatus: string; // Veteran, Not a Veteran, Prefer not to say

  @Column({ nullable: true })
  disabilityStatus: string; // Yes, No, Prefer not to say

  // Availability & Preferences
  @Column({ nullable: true })
  availabilityDate: string; // When can start

  @Column({ nullable: true, default: false })
  willingToRelocate: boolean;

  @Column({ nullable: true, default: false })
  willingToTravel: boolean;

  @Column({ nullable: true })
  travelPercentage: string; // 0%, 25%, 50%, 75%, 100%

  @Column({ nullable: true })
  workPreference: string; // Remote, Hybrid, On-site, Flexible

  // Languages
  @Column({ type: "jsonb", nullable: true, default: [] })
  languages: { language: string; proficiency: string }[];

  // Additional Info
  @Column({ nullable: true })
  hearAboutUs: string; // How did you hear about this job

  @Column({ type: "jsonb", nullable: true, default: [] })
  references: { name: string; company: string; title: string; email: string; phone: string; relationship: string }[];

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;
}
