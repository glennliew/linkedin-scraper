import OpenAI from "openai";
import { ProfileData } from "../types";

/**
 * Service class for AI-powered profile analysis using OpenAI.
 */
export class IntelligenceService
{
    private openai: OpenAI;

    constructor()
    {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    /**
     * Extracts keywords from a profile using OpenAI GPT.
     * @param profile - The profile data to analyze
     * @returns Promise resolving to an array of keyword strings
     */
    async extractKeywords(profile: ProfileData): Promise<string[]>
    {
        console.log("Extracting keywords using OpenAI...");

        // Format projects for the prompt
        const projectsText = profile.projects
            .map((p) => `${p.name}${p.description ? `: ${p.description}` : ""}`)
            .join("\n");

        // Format volunteering for the prompt
        const volunteeringText = profile.volunteering
            .map((v) => `${v.role} at ${v.organization}${v.cause ? ` (${v.cause})` : ""}`)
            .join("\n");

        const prompt = `
      You are an expert at analyzing professional identities. 
      Analyze the following LinkedIn profile data and extract 15 distinct, high-value keywords or short phrases that define this person's professional 'vibe', skills, and interests for a matching algorithm.
      
      Profile Data:
      Name: ${profile.name}
      Headline: ${profile.headline}
      About: ${profile.about}
      Experience: ${profile.experience.join("\n")}
      Education: ${profile.education.map((e) => `${e.degree || ""} at ${e.school}`).join("\n")}
      Skills: ${profile.skills.join(", ")}
      Projects: ${projectsText || "None listed"}
      Volunteering: ${volunteeringText || "None listed"}
      Interests: ${profile.interests.join(", ") || "None listed"}
      
      Return ONLY a JSON array of strings. Example: ["Software Engineering", "React", "Leadership", "Startup Scaling"]
    `;

        try
        {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "system", content: prompt }],
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
            });

            const content = completion.choices[0].message.content;
            if (!content)
            {
                throw new Error("No content received from OpenAI");
            }

            const result = JSON.parse(content) as Record<string, unknown>;

            // Handle various response formats
            if (Array.isArray(result))
            {
                return result as string[];
            } else if (result.keywords && Array.isArray(result.keywords))
            {
                return result.keywords as string[];
            } else
            {
                const values = Object.values(result).find((v) => Array.isArray(v));
                if (values)
                {
                    return values as string[];
                }
                return [];
            }
        } catch (error)
        {
            console.error("Error extracting keywords:", error);
            return [];
        }
    }

    /**
     * Generates an embedding vector for the given keywords using OpenAI.
     * @param keywords - Array of keywords to embed
     * @returns Promise resolving to the embedding vector
     */
    async generateEmbedding(keywords: string[]): Promise<number[]>
    {
        console.log("Generating embedding for keywords...");

        const textToEmbed = keywords.join(" ");

        try
        {
            const response = await this.openai.embeddings.create({
                model: "text-embedding-3-small",
                input: textToEmbed,
                encoding_format: "float",
            });

            return response.data[0].embedding;
        } catch (error)
        {
            console.error("Error generating embedding:", error);
            throw error;
        }
    }
}

