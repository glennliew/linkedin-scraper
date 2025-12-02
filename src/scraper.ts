import Exa from "exa-js";
import { EducationEntry, ProfileData, ProjectEntry, VolunteerEntry } from "./types";

const exa = new Exa(process.env.EXASEARCH_API_KEY);

/**
 * Extracts LinkedIn URLs from markdown text.
 * @param text - The markdown text to parse
 * @returns Object containing arrays of company and school URLs
 */
function extractLinkedInUrls(text: string): {
    companyUrls: string[];
    schoolUrls: string[];
}
{
    const companyUrls: string[] = [];
    const schoolUrls: string[] = [];

    // Regex to find LinkedIn company and school URLs in markdown link format
    const urlRegex = /\[([^\]]+)\]\((https:\/\/(?:www\.)?linkedin\.com\/(?:company|school)\/[^\)]+)\)/g;

    let match: RegExpExecArray | null;
    while ((match = urlRegex.exec(text)) !== null)
    {
        const url = match[2];
        if (url.includes("/company/"))
        {
            companyUrls.push(url);
        } else if (url.includes("/school/"))
        {
            schoolUrls.push(url);
        }
    }

    return {
        companyUrls: [...new Set(companyUrls)], // Remove duplicates
        schoolUrls: [...new Set(schoolUrls)],
    };
}

/**
 * Parses work experience from the markdown text.
 * @param text - The full profile markdown text
 * @returns Array of work experience strings (e.g., "Title at Company")
 */
function parseWorkExperience(text: string): string[]
{
    const experiences: string[] = [];

    // Look for work experience section with various possible headers
    const workSectionMatch = text.match(/## (?:Work Experience|Experience)\n([\s\S]*?)(?=\n## |$)/i);
    if (!workSectionMatch)
    {
        return experiences;
    }

    const workSection = workSectionMatch[1];

    // Split by experience entries (starting with - ###)
    const entries = workSection.split(/- ### /).filter((e) => e.trim());

    for (const entry of entries)
    {
        // Extract title and company - handle both linked and plain text formats
        const linkedMatch = entry.match(/^(.+?) at \[([^\]]+)\]\(([^\)]+)\)/);
        const plainMatch = entry.match(/^(.+?) at ([^\n]+)/);

        if (linkedMatch)
        {
            const title = linkedMatch[1].trim();
            const company = linkedMatch[2].trim();
            experiences.push(`${title} at ${company}`);
        } else if (plainMatch)
        {
            const title = plainMatch[1].trim();
            const company = plainMatch[2].trim();
            experiences.push(`${title} at ${company}`);
        }
    }

    return experiences;
}

/**
 * Parses education entries from the markdown text.
 * Handles Exa markdown format: ### Degree || Field at [School](url)
 * @param text - The full profile markdown text
 * @returns Array of education entry objects
 */
function parseEducation(text: string): EducationEntry[]
{
    const education: EducationEntry[] = [];

    // Look for education section
    const eduSectionMatch = text.match(/## Education\n([\s\S]*?)(?=\n## |$)/i);
    if (!eduSectionMatch)
    {
        return education;
    }

    const eduSection = eduSectionMatch[1];

    // Split by education entries (starting with ### or - ###)
    const entries = eduSection.split(/(?:^|\n)(?:-\s*)?###\s+/).filter((e) => e.trim());

    for (const entry of entries)
    {
        let school = "";
        let schoolUrl: string | undefined;
        let degree: string | undefined;
        let fieldOfStudy: string | undefined;
        let dateRange: string | undefined;

        // Format 1: "Degree || Field at [School](url)" or "Degree at [School](url)"
        // This matches the work experience format
        const linkedFormatMatch = entry.match(/^(.+?)\s+at\s+\[([^\]]+)\]\(([^\)]*)\)/);
        if (linkedFormatMatch)
        {
            const degreeAndField = linkedFormatMatch[1].trim();
            school = linkedFormatMatch[2].trim();
            schoolUrl = linkedFormatMatch[3] || undefined;

            // Parse degree and field - may be separated by "||" or ","
            if (degreeAndField.includes("||"))
            {
                const parts = degreeAndField.split("||").map((p) => p.trim());
                degree = parts[0];
                fieldOfStudy = parts.slice(1).join(", ");
            } else if (degreeAndField.includes(","))
            {
                const parts = degreeAndField.split(",").map((p) => p.trim());
                degree = parts[0];
                fieldOfStudy = parts.slice(1).join(", ");
            } else
            {
                degree = degreeAndField;
            }
        } else
        {
            // Format 2: "Degree at School" (plain text, no link)
            const plainFormatMatch = entry.match(/^(.+?)\s+at\s+([^\n\[]+)/);
            if (plainFormatMatch)
            {
                const degreeAndField = plainFormatMatch[1].trim();
                school = plainFormatMatch[2].trim();

                if (degreeAndField.includes("||"))
                {
                    const parts = degreeAndField.split("||").map((p) => p.trim());
                    degree = parts[0];
                    fieldOfStudy = parts.slice(1).join(", ");
                } else if (degreeAndField.includes(","))
                {
                    const parts = degreeAndField.split(",").map((p) => p.trim());
                    degree = parts[0];
                    fieldOfStudy = parts.slice(1).join(", ");
                } else
                {
                    degree = degreeAndField;
                }
            } else
            {
                // Format 3: Just "[School](url)" with degree on next line
                const schoolOnlyMatch = entry.match(/^\[([^\]]+)\]\(([^\)]*)\)/);
                if (schoolOnlyMatch)
                {
                    school = schoolOnlyMatch[1].trim();
                    schoolUrl = schoolOnlyMatch[2] || undefined;

                    // Look for degree in subsequent lines
                    const restOfEntry = entry.slice(schoolOnlyMatch[0].length);
                    const lines = restOfEntry.split("\n").map((l) => l.trim()).filter((l) => l);
                    for (const line of lines)
                    {
                        if (!degree && line.length > 2 && !line.match(/^[-•\d]/))
                        {
                            const parts = line.split(/[,|]/).map((p) => p.trim()).filter((p) => p);
                            degree = parts[0];
                            if (parts.length > 1)
                            {
                                fieldOfStudy = parts.slice(1).join(", ");
                            }
                            break;
                        }
                    }
                } else
                {
                    // Format 4: Plain text school name
                    const plainSchoolMatch = entry.match(/^([^\n]+)/);
                    if (plainSchoolMatch)
                    {
                        school = plainSchoolMatch[1].trim();
                    }
                }
            }
        }

        if (!school)
        {
            continue;
        }

        // Extract date range from the full entry
        const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i);
        if (dateMatch)
        {
            dateRange = dateMatch[0];
        }

        education.push({
            school,
            degree,
            fieldOfStudy,
            dateRange,
            schoolUrl: schoolUrl && schoolUrl.length > 0 ? schoolUrl : undefined,
        });
    }

    return education;
}

/**
 * Parses project entries from the markdown text.
 * @param text - The full profile markdown text
 * @returns Array of project entry objects
 */
function parseProjects(text: string): ProjectEntry[]
{
    const projects: ProjectEntry[] = [];

    // Look for projects section
    const projectSectionMatch = text.match(/## Projects?\n([\s\S]*?)(?=\n## |$)/i);
    if (!projectSectionMatch)
    {
        return projects;
    }

    const projectSection = projectSectionMatch[1];

    // Split by project entries
    const entries = projectSection.split(/- (?:###|\*\*) /).filter((e) => e.trim());

    for (const entry of entries)
    {
        // Extract project name
        const nameMatch = entry.match(/^([^\n\[]+)/) || entry.match(/^\[([^\]]+)\]/);
        const name = nameMatch ? nameMatch[1].trim().replace(/\*\*/g, "") : "";

        if (!name)
        {
            continue;
        }

        // Extract description (usually follows the name)
        const descMatch = entry.match(/\n\s*([^-\n][^\n]+)/);
        const description = descMatch ? descMatch[1].trim() : undefined;

        // Extract date range
        const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i) ||
            entry.match(/(?:Date|Duration):\s*([^\n]+)/i);
        const dateRange = dateMatch ? dateMatch[0].trim() : undefined;

        // Extract associated company/organization
        const assocMatch = entry.match(/(?:Associated with|At|For):\s*\[?([^\]\n]+)\]?/i);
        const associatedWith = assocMatch ? assocMatch[1].trim() : undefined;

        projects.push({
            name,
            description,
            dateRange,
            associatedWith,
        });
    }

    return projects;
}

/**
 * Parses volunteering entries from the markdown text.
 * @param text - The full profile markdown text
 * @returns Array of volunteer entry objects
 */
function parseVolunteering(text: string): VolunteerEntry[]
{
    const volunteering: VolunteerEntry[] = [];

    // Look for volunteering section (various possible headers)
    const volSectionMatch = text.match(/## (?:Volunteer(?:ing)?|Volunteer Experience)\n([\s\S]*?)(?=\n## |$)/i);
    if (!volSectionMatch)
    {
        return volunteering;
    }

    const volSection = volSectionMatch[1];

    // Split by volunteer entries
    const entries = volSection.split(/- (?:###|\*\*) /).filter((e) => e.trim());

    for (const entry of entries)
    {
        // Extract role and organization - handle both linked and plain formats
        // Pattern: "Role at [Organization](url)" or "Role at Organization"
        const linkedMatch = entry.match(/^(.+?) at \[([^\]]+)\]\((https:\/\/[^\)]+)\)/);
        const plainMatch = entry.match(/^(.+?) at ([^\n]+)/);

        let role = "";
        let organization = "";
        let organizationUrl: string | undefined;

        if (linkedMatch)
        {
            role = linkedMatch[1].trim();
            organization = linkedMatch[2].trim();
            organizationUrl = linkedMatch[3];
        } else if (plainMatch)
        {
            role = plainMatch[1].trim().replace(/\*\*/g, "");
            organization = plainMatch[2].trim();
        }

        if (!role || !organization)
        {
            continue;
        }

        // Extract cause
        const causeMatch = entry.match(/(?:Cause|Focus):\s*([^\n]+)/i);
        const cause = causeMatch ? causeMatch[1].trim() : undefined;

        // Extract date range
        const dateMatch = entry.match(/(\d{4})\s*[-–]\s*(\d{4}|Present)/i) ||
            entry.match(/(?:Date|Duration):\s*([^\n]+)/i);
        const dateRange = dateMatch ? dateMatch[0].trim() : undefined;

        volunteering.push({
            role,
            organization,
            cause,
            dateRange,
            organizationUrl,
        });
    }

    return volunteering;
}

/**
 * Parses skills from the markdown text.
 * @param text - The full profile markdown text
 * @returns Array of skill strings
 */
function parseSkills(text: string): string[]
{
    const skills: string[] = [];

    // Look for skills section
    const skillsSectionMatch = text.match(/## Skills?\n([\s\S]*?)(?=\n## |$)/i);
    if (!skillsSectionMatch)
    {
        return skills;
    }

    const skillsSection = skillsSectionMatch[1];

    // Skills can be listed as:
    // - Bullet points: "- Skill Name"
    // - Numbered: "1. Skill Name"
    // - Comma-separated
    // - New lines

    // Try bullet/numbered list format first
    const bulletMatches = skillsSection.matchAll(/[-•*]\s*([^\n]+)/g);
    for (const match of bulletMatches)
    {
        const skill = match[1].trim().replace(/\*\*/g, "");
        if (skill && !skill.startsWith("#"))
        {
            skills.push(skill);
        }
    }

    // If no bullet items found, try comma-separated or newline-separated
    if (skills.length === 0)
    {
        const lines = skillsSection.split(/[,\n]/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
        skills.push(...lines);
    }

    // Remove duplicates and empty entries
    return [...new Set(skills)].filter((s) => s.length > 0);
}

/**
 * Parses interests from the markdown text (companies, groups, schools, influencers followed).
 * @param text - The full profile markdown text
 * @returns Array of interest strings
 */
function parseInterests(text: string): string[]
{
    const interests: string[] = [];

    // Look for interests section (various possible headers)
    const interestsSectionMatch = text.match(/## (?:Interests?|Following|Groups?|Companies? Followed)\n([\s\S]*?)(?=\n## |$)/i);
    if (!interestsSectionMatch)
    {
        return interests;
    }

    const interestsSection = interestsSectionMatch[1];

    // Extract names from linked items: [Name](url) or bullet points
    const linkedMatches = interestsSection.matchAll(/\[([^\]]+)\]\([^\)]+\)/g);
    for (const match of linkedMatches)
    {
        const interest = match[1].trim();
        if (interest)
        {
            interests.push(interest);
        }
    }

    // Also try bullet point format
    const bulletMatches = interestsSection.matchAll(/[-•*]\s*([^\n\[]+)/g);
    for (const match of bulletMatches)
    {
        const interest = match[1].trim().replace(/\*\*/g, "");
        if (interest && !interest.startsWith("#"))
        {
            interests.push(interest);
        }
    }

    // Remove duplicates
    return [...new Set(interests)];
}

/**
 * Scrapes a LinkedIn profile using the Exa API.
 * @param url - The LinkedIn profile URL to scrape
 * @returns Promise resolving to the parsed profile data
 * @throws Error if EXASEARCH_API_KEY is missing or if scraping fails
 */
export async function scrapeLinkedInProfile(url: string): Promise<ProfileData>
{
    console.log(`Starting Exa scrape for: ${url}`);

    if (!process.env.EXASEARCH_API_KEY)
    {
        throw new Error("EXASEARCH_API_KEY is missing in .env file.");
    }

    try
    {
        // 1. Fetch the LinkedIn profile content
        const result = await exa.getContents([url], { text: true });

        if (!result.results || result.results.length === 0)
        {
            throw new Error("No results from Exa");
        }

        const profileData = result.results[0];
        const text = profileData.text || "";
        const name = profileData.author || "";
        const image = profileData.image || undefined;

        // 2. Extract bio/about section (handle various header formats)
        const aboutMatch = text.match(/## (?:About me|About|Summary)\n([\s\S]*?)(?=\n## |$)/i);
        const about = aboutMatch?.[1]?.trim() || "";

        // 3. Extract headline (usually the line after the name or first line of text)
        // Exa text structure varies, but often starts with Name\nHeadline
        const lines = text.split("\n").filter((l) => l.trim());
        let headline = "";
        // Simple heuristic: if the first line is the name, the second might be the headline
        if (lines.length > 1 && lines[0].includes(name))
        {
            headline = lines[1].trim();
        } else
        {
            headline = lines[0].trim(); // Fallback
        }

        // 4. Parse all profile sections
        const experience = parseWorkExperience(text);
        const education = parseEducation(text);
        const projects = parseProjects(text);
        const volunteering = parseVolunteering(text);
        const skills = parseSkills(text);
        const interests = parseInterests(text);

        // 5. Construct the profile data object
        const data: ProfileData = {
            name,
            headline,
            about,
            experience,
            education,
            projects,
            volunteering,
            skills,
            interests,
            url,
            image
        };

        console.log("Exa scraping complete.");
        console.log(`  - Education entries: ${education.length}`);
        console.log(`  - Projects: ${projects.length}`);
        console.log(`  - Volunteering entries: ${volunteering.length}`);
        console.log(`  - Skills: ${skills.length}`);
        console.log(`  - Interests: ${interests.length}`);

        return data;
    } catch (error)
    {
        console.error("Error during Exa scraping:", error);
        throw error;
    }
}
