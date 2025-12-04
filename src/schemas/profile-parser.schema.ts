import { z } from "zod";

/**
 * Zod schema for education entry extraction.
 * Describes the expected structure for LLM structured output.
 */
const EducationEntrySchema = z.object({
    /** Name of the school or institution */
    school: z.string().describe("Name of the school or institution (clean text, no markdown)"),
    /** Degree obtained */
    degree: z.string().optional().describe("Degree obtained (e.g., 'Bachelor of Science', 'Master's degree')"),
    /** Field of study */
    fieldOfStudy: z.string().optional().describe("Field of study (e.g., 'Computer Science', 'Business Administration')"),
    /** Date range string */
    dateRange: z.string().optional().describe("Date range (e.g., '2015 - 2019', '2020 - Present')"),
    /** LinkedIn URL for the school */
    schoolUrl: z.string().optional().describe("LinkedIn URL for the school if available"),
});

/**
 * Zod schema for project entry extraction.
 */
const ProjectEntrySchema = z.object({
    /** Name of the project */
    name: z.string().describe("Name of the project"),
    /** Description of the project */
    description: z.string().optional().describe("Description of the project"),
    /** Date range or duration */
    dateRange: z.string().optional().describe("Date range or duration of the project"),
    /** Associated company or organization */
    associatedWith: z.string().optional().describe("Associated company or organization"),
});

/**
 * Zod schema for volunteering entry extraction.
 */
const VolunteerEntrySchema = z.object({
    /** Role or position held */
    role: z.string().describe("Role or position held (e.g., 'Volunteer', 'Board Member')"),
    /** Organization name */
    organization: z.string().describe("Name of the organization (clean text, no markdown)"),
    /** Cause or area of focus */
    cause: z.string().optional().describe("Cause or area of focus (e.g., 'Education', 'Environment')"),
    /** Date range of volunteering */
    dateRange: z.string().optional().describe("Date range of volunteering"),
    /** LinkedIn URL for the organization */
    organizationUrl: z.string().optional().describe("LinkedIn URL for the organization if available"),
});

/**
 * Main Zod schema for LLM-based profile parsing.
 * Used with OpenAI structured outputs to extract profile data from raw markdown text.
 */
export const ProfileParserSchema = z.object({
    /** Full name of the person */
    name: z.string().describe("Full name of the person"),
    /** Professional headline/tagline */
    headline: z.string().describe("Professional headline or tagline (e.g., 'Software Engineer at Google')"),
    /** About/summary section */
    about: z.string().describe("About or summary section content. Return empty string if not present."),
    /** Work experience entries */
    experience: z.array(z.string()).describe("Work experience as 'Title at Company' strings (e.g., 'Software Engineer at Google')"),
    /** Education entries */
    education: z.array(EducationEntrySchema).describe("List of education entries"),
    /** Project entries */
    projects: z.array(ProjectEntrySchema).describe("List of projects"),
    /** Volunteering entries */
    volunteering: z.array(VolunteerEntrySchema).describe("List of volunteering experiences"),
    /** Skills list */
    skills: z.array(z.string()).describe("List of skills mentioned in the profile"),
    /** Interests list */
    interests: z.array(z.string()).describe("List of interests, companies followed, or groups"),
});

/** Type inferred from the ProfileParserSchema */
export type ParsedProfile = z.infer<typeof ProfileParserSchema>;

