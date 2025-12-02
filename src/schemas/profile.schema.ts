import { z } from "zod";

/**
 * Zod schema for validating profile scrape requests.
 */
export const scrapeProfileSchema = z.object({
    body: z.object({
        linkedinUrl: z.string().url().includes("linkedin.com/in/"),
    }),
});

/** Type for the validated scrape profile request */
export type ScrapeProfileRequest = z.infer<typeof scrapeProfileSchema>;

