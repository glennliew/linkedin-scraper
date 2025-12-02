/**
 * Represents an education entry from a LinkedIn profile.
 */
export interface EducationEntry
{
    /** Name of the school or institution */
    school: string;
    /** Degree obtained (e.g., "Bachelor of Science") */
    degree?: string;
    /** Field of study (e.g., "Computer Science") */
    fieldOfStudy?: string;
    /** Date range string (e.g., "2015 - 2019") */
    dateRange?: string;
    /** LinkedIn URL for the school */
    schoolUrl?: string;
}

/**
 * Represents a project entry from a LinkedIn profile.
 */
export interface ProjectEntry
{
    /** Name of the project */
    name: string;
    /** Description of the project */
    description?: string;
    /** Date range or duration of the project */
    dateRange?: string;
    /** Associated company or organization */
    associatedWith?: string;
}

/**
 * Represents a volunteering entry from a LinkedIn profile.
 */
export interface VolunteerEntry
{
    /** Role or position held */
    role: string;
    /** Organization name */
    organization: string;
    /** Cause or area of focus (e.g., "Education", "Environment") */
    cause?: string;
    /** Date range of volunteering */
    dateRange?: string;
    /** LinkedIn URL for the organization */
    organizationUrl?: string;
}

/**
 * Aggregated profile data scraped from a LinkedIn profile.
 */
export interface ProfileData
{
    /** Full name of the profile owner */
    name: string;
    /** Professional headline */
    headline: string;
    /** About/summary section */
    about: string;
    /** List of work experience entries */
    experience: string[];
    /** List of education entries */
    education: EducationEntry[];
    /** List of project entries */
    projects: ProjectEntry[];
    /** List of volunteering entries */
    volunteering: VolunteerEntry[];
    /** List of skills */
    skills: string[];
    /** List of interests (companies, groups, schools, influencers) */
    interests: string[];
    /** LinkedIn profile URL */
    url: string;
    /** Profile image URL */
    image?: string;
    /** Raw markdown text from Exa (for debugging) */
    rawText?: string;
}

export interface ScraperResult
{
    profile: ProfileData;
    keywords: string[];
    embedding: number[];
}
