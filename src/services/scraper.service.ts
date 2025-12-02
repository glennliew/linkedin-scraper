import { ProfileData } from "../types";
import { scrapeLinkedInProfile } from "../scraper";

/**
 * Service class for scraping LinkedIn profiles using Exa API.
 */
export class ScraperService
{
    /**
     * Scrapes a LinkedIn profile and returns the parsed profile data.
     * @param url - The LinkedIn profile URL to scrape
     * @returns Promise resolving to the scraped profile data
     */
    async scrapeProfile(url: string): Promise<ProfileData>
    {
        return scrapeLinkedInProfile(url);
    }
}

