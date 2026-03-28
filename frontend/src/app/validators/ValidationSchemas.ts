import { z } from 'zod';

// ==================== REGEX PATTERNS ====================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const URL_REGEX = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const LINKEDIN_REGEX = /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|company)\//;
const GITHUB_REGEX = /^(https?:\/\/)?(www\.)?github\.com\//;

// ==================== SHARED/COMMON SCHEMAS ====================

export const EmailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format")
  .regex(EMAIL_REGEX, "Invalid email address");

export const PhoneSchema = z
  .string()
  .regex(PHONE_REGEX, "Invalid phone number format")
  .optional();

export const UrlSchema = z
  .string()
  .regex(URL_REGEX, "Invalid URL format")
  .optional();

export const NameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be less than 100 characters");

export const DateOfBirthSchema = z
  .string()
  .refine(
    (date) => {
      const birthDate = new Date(date);
      const age = new Date().getFullYear() - birthDate.getFullYear();
      return age >= 18 && age <= 100;
    },
    "You must be at least 18 years old and not more than 100"
  )
  .optional();

// ==================== PROFILE VALIDATION SCHEMAS ====================

export const InfoSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  jobTitle: z.string().max(100, "Job title must be less than 100 characters").optional(),
  company: z.string().max(100, "Company must be less than 100 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  totalExp: z.number().min(0, "Experience cannot be negative").max(70, "Experience cannot exceed 70 years").optional(),
});

export const CVHeadlineSchema = z.object({
  cvHeadline: z
    .string()
    .min(10, "CV Headline must be at least 10 characters")
    .max(500, "CV Headline must be less than 500 characters")
    .optional(),
});

export const AboutSchema = z.object({
  about: z
    .string()
    .min(20, "About section must be at least 20 characters")
    .max(5000, "About section must be less than 5000 characters")
    .optional(),
});

export const SkillsSchema = z.object({
  skills: z
    .array(z.string().min(2, "Skill must be at least 2 characters"))
    .min(1, "At least one skill is required")
    .max(50, "Maximum 50 skills allowed"),
});

export const ExperienceSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  company: z.string().min(2, "Company name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
});

export const ExperiencesSchema = z.object({
  experiences: z.array(ExperienceSchema).optional(),
});

export const CertificationSchema = z.object({
  name: z.string().min(2, "Certification name is required"),
  issuer: z.string().min(2, "Issuer name is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  certificateId: z.string().min(1, "Certificate ID is required"),
});

export const CertificationsSchema = z.object({
  certifications: z.array(CertificationSchema).optional(),
});

export const EducationSchema = z.object({
  degree: z.string().min(2, "Degree is required"),
  field: z.string().min(2, "Field is required"),
  college: z.string().min(2, "College/University is required"),
  yearOfPassing: z
    .string()
    .regex(/^\d{4}$/, "Year must be 4 digits")
    .refine(
      (year) => {
        const yearNum = parseInt(year);
        return yearNum >= 1950 && yearNum <= new Date().getFullYear() + 5;
      },
      "Year must be between 1950 and next 5 years"
    ),
});

export const EducationsSchema = z.object({
  education: z.array(EducationSchema).optional(),
});

export const PersonalDetailsSchema = z.object({
  dateOfBirth: DateOfBirthSchema,
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  nationality: z.string().max(50, "Nationality must be less than 50 characters").optional(),
  maritalStatus: z.enum(["Single", "Married", "Divorced", "Widowed"]).optional(),
  drivingLicense: z.enum(["Yes", "No"]).optional(),
  currentLocation: z.string().max(100, "Location must be less than 100 characters").optional(),
  languagesKnown: z.array(z.string()).optional(),
  visaStatus: z.string().max(100, "Visa status must be less than 100 characters").optional(),
  religion: z.string().max(50, "Religion must be less than 50 characters").optional(),
  alternateEmail: EmailSchema.optional(),
  alternateContact: PhoneSchema,
});

export const OnlineProfilesSchema = z.object({
  onlineProfiles: z
    .array(
      z.object({
        platform: z.string().min(2, "Platform is required"),
        url: UrlSchema,
      })
    )
    .optional(),
});

export const WorkSamplesSchema = z.object({
  workSamples: z
    .array(
      z.object({
        title: z.string().min(3, "Title is required"),
        url: UrlSchema,
        description: z.string().max(500, "Description must be less than 500 characters").optional(),
      })
    )
    .optional(),
});

export const DesiredJobSchema = z.object({
  preferredDesignations: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredIndustries: z.array(z.string()).optional(),
});

export const FullProfileSchema = z.object({
  id: z.number().optional(),
  ...InfoSchema.shape,
  ...CVHeadlineSchema.shape,
  ...AboutSchema.shape,
  ...SkillsSchema.shape,
  ...ExperiencesSchema.shape,
  ...EducationsSchema.shape,
  ...PersonalDetailsSchema.shape,
  ...OnlineProfilesSchema.shape,
  ...WorkSamplesSchema.shape,
  ...DesiredJobSchema.shape,
  picture: z.string().optional(),
  banner: z.string().optional(),
  profileSummary: z.string().max(2000, "Profile summary must be less than 2000 characters").optional(),
  certifications: z.array(z.any()).optional(),
});

// ==================== AUTH VALIDATION SCHEMAS ====================

export const SignUpSchema = z
  .object({
    name: NameSchema,
    email: EmailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    accountType: z.enum(["APPLICANT", "EMPLOYER"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required"),
});

// ==================== JOB POSTING VALIDATION SCHEMA ====================

export const JobPostingSchema = z.object({
  jobTitle: z
    .string()
    .min(3, "Job title must be at least 3 characters")
    .max(100, "Job title must be less than 100 characters"),
  location: z.string().min(2, "Location is required"),
  salary: z.number().min(0, "Salary cannot be negative").optional(),
  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be less than 5000 characters"),
  requirements: z.array(z.string()).min(1, "At least one requirement is needed"),
  experience: z.number().min(0, "Experience cannot be negative").max(70, "Experience cannot exceed 70 years").optional(),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]).optional(),
});

// ==================== SEARCH/FILTER VALIDATION SCHEMAS ====================

export const JobSearchSchema = z.object({
  keyword: z.string().max(100, "Search keyword too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  jobType: z.enum(["Full-time", "Part-time", "Contract", "Internship"]).optional(),
  minSalary: z.number().min(0).optional(),
  maxSalary: z.number().min(0).optional(),
  page: z.number().min(1, "Page must be at least 1"),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100"),
});

export const TalentSearchSchema = z.object({
  keyword: z.string().max(100, "Search keyword too long").optional(),
  location: z.string().max(100, "Location too long").optional(),
  skills: z.array(z.string()).optional(),
  experience: z.number().min(0).optional(),
  page: z.number().min(1, "Page must be at least 1"),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit cannot exceed 100"),
});

// ==================== API RESPONSE VALIDATION SCHEMAS ====================

export const ApiResponseSchema = z.object({
  status: z.number(),
  data: z.any().optional(),
  message: z.string().optional(),
  errors: z.record(z.string()).optional(),
});

export type SignUpFormData = z.infer<typeof SignUpSchema>;
export type LoginFormData = z.infer<typeof LoginSchema>;
export type InfoFormData = z.infer<typeof InfoSchema>;
export type ProfileData = z.infer<typeof FullProfileSchema>;
export type JobPostingData = z.infer<typeof JobPostingSchema>;
export type JobSearchFilters = z.infer<typeof JobSearchSchema>;
export type TalentSearchFilters = z.infer<typeof TalentSearchSchema>;
