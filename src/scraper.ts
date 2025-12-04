import Exa from "exa-js";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { ProfileParserSchema, ParsedProfile } from "./schemas/profile-parser.schema";
import { ProfileData } from "./types";

/** Lazily initialized Exa client instance */
let exaClient: Exa | null = null;

/** Lazily initialized OpenAI client instance */
let openaiClient: OpenAI | null = null;

/**
 * Gets or creates the Exa client instance.
 * @returns The Exa client
 * @throws Error if EXASEARCH_API_KEY is not set
 */
function getExaClient(): Exa
{
    if (!exaClient)
    {
        if (!process.env.EXASEARCH_API_KEY)
        {
            throw new Error("EXASEARCH_API_KEY is missing in .env file.");
        }
        exaClient = new Exa(process.env.EXASEARCH_API_KEY);
    }
    return exaClient;
}

/**
 * Gets or creates the OpenAI client instance.
 * @returns The OpenAI client
 * @throws Error if OPENAI_API_KEY is not set
 */
function getOpenAIClient(): OpenAI
{
    if (!openaiClient)
    {
        if (!process.env.OPENAI_API_KEY)
        {
            throw new Error("OPENAI_API_KEY is missing in .env file.");
        }
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

/**
 * System prompt for the LLM profile parser.
 * Instructs the model to extract structured profile data from raw markdown text.
 */
const PROFILE_PARSER_SYSTEM_PROMPT = `You are an expert LinkedIn profile data extractor. Your task is to extract structured information from raw LinkedIn profile markdown text.

Instructions:
1. Extract all profile fields accurately from the provided markdown text.
2. Clean up any markdown formatting (remove brackets, parentheses from links, etc.) - return clean text values.
3. For education entries:
   - Extract the school name without any markdown syntax
   - Separate degree and field of study if both are present
   - Include LinkedIn URLs if available
4. For work experience:
   - Format as "Title at Company" strings
5. For projects and volunteering:
   - Extract all available details (name, description, dates, etc.)
6. If a section is not present in the text, return an empty array for that field.
7. If a field's value cannot be determined, use an empty string for required string fields.
8. Do NOT include any markdown syntax in the output values.
9. For URLs, extract only valid URLs (starting with http:// or https://).

Be thorough and extract all available information from the profile.`;

/**
 * Parses LinkedIn profile data from raw markdown text using OpenAI LLM.
 * Uses structured outputs with Zod schema for type-safe extraction.
 * @param rawText - The raw markdown text from Exa
 * @returns Promise resolving to the parsed profile fields
 * @throws Error if OpenAI API call fails or parsing fails
 */
async function parseProfileWithLLM(rawText: string): Promise<ParsedProfile>
{
    console.log("Parsing profile with LLM...");

    const openai = getOpenAIClient();

    const completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: PROFILE_PARSER_SYSTEM_PROMPT },
            { role: "user", content: rawText },
        ],
        response_format: zodResponseFormat(ProfileParserSchema, "profile"),
    });

    const parsed = completion.choices[0].message.parsed;

    if (!parsed)
    {
        throw new Error("Failed to parse profile data from LLM response");
    }

    console.log("LLM parsing complete.");

    return parsed;
}

/**
 * Scrapes a LinkedIn profile using the Exa API and parses it with LLM.
 * @param url - The LinkedIn profile URL to scrape
 * @returns Promise resolving to the parsed profile data
 * @throws Error if EXASEARCH_API_KEY/OPENAI_API_KEY is missing or if scraping fails
 */
export async function scrapeLinkedInProfile(url: string): Promise<ProfileData>
{
    console.log(`Starting Exa scrape for: ${url}`);

    const exa = getExaClient();

    try
    {
        // 1. Fetch the LinkedIn profile content from Exa
        const result = await exa.getContents([url], { text: true });

        if (!result.results || result.results.length === 0)
        {
            throw new Error("No results from Exa");
        }

        const profileData = result.results[0];
        const rawText = profileData.text || "";
        const image = profileData.image || undefined;

        // 2. Parse the profile using LLM with structured outputs
        const parsed = await parseProfileWithLLM(rawText);

        // 3. Construct the profile data object
        const data: ProfileData = {
            name: parsed.name,
            headline: parsed.headline,
            about: parsed.about,
            experience: parsed.experience,
            education: parsed.education,
            projects: parsed.projects,
            volunteering: parsed.volunteering,
            skills: parsed.skills,
            interests: parsed.interests,
            url,
            image,
            rawText, // Include raw Exa markdown for debugging
        };

        console.log("Exa scraping complete.");
        console.log(`  - Education entries: ${data.education.length}`);
        console.log(`  - Projects: ${data.projects.length}`);
        console.log(`  - Volunteering entries: ${data.volunteering.length}`);
        console.log(`  - Skills: ${data.skills.length}`);
        console.log(`  - Interests: ${data.interests.length}`);

        return data;
    } catch (error)
    {
        console.error("Error during Exa scraping:", error);
        throw error;
    }
}
