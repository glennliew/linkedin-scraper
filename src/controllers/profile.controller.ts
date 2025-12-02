import { Request, Response } from "express";
import fs from "fs/promises";
import { ScraperService } from "../services/scraper.service";
import { IntelligenceService } from "../services/intelligence.service";
import { logger } from "../utils/logger";

const scraperService = new ScraperService();
const intelligenceService = new IntelligenceService();

/** Path to save the latest result */
const RESULT_FILE = "result.json";

/**
 * Request body interface for profile scraping.
 */
interface ScrapeProfileBody
{
    linkedinUrl: string;
}

/**
 * Controller handler for scraping a LinkedIn profile.
 * Scrapes the profile, extracts keywords, and generates embeddings.
 * Saves the latest result to result.json.
 */
export const scrapeProfile = async (
    req: Request<object, object, ScrapeProfileBody>,
    res: Response
): Promise<void> =>
{
    const { linkedinUrl } = req.body;

    try
    {
        logger.info(`Received scrape request for: ${linkedinUrl}`);

        // 1. Scrape the profile using Exa
        const profile = await scraperService.scrapeProfile(linkedinUrl);
        logger.info(`Profile scraped successfully: ${profile.name}`);

        // 2. Extract keywords using OpenAI
        const keywords = await intelligenceService.extractKeywords(profile);
        logger.info(`Keywords extracted: ${keywords.length} keywords`);

        // 3. Generate embedding vector (handles empty keywords gracefully)
        const embedding = await intelligenceService.generateEmbedding(keywords);
        if (embedding.length > 0)
        {
            logger.info(`Embedding generated: ${embedding.length} dimensions`);
        } else
        {
            logger.warn("No embedding generated (keywords may be empty)");
        }

        // 4. Build the result object
        const result = {
            profile,
            keywords,
            embedding,
        };

        // 5. Save to result.json
        await fs.writeFile(RESULT_FILE, JSON.stringify(result, null, 2));
        logger.info(`Result saved to ${RESULT_FILE}`);

        // 6. Return the complete response
        res.json({
            success: true,
            data: result,
        });
    } catch (error)
    {
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        logger.error({ err: error }, "Failed to process profile");
        res.status(500).json({
            success: false,
            error: errorMessage,
        });
    }
};

