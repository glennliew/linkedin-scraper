import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { scrapeProfile } from "./controllers/profile.controller";
import { scrapeProfileSchema } from "./schemas/profile.schema";
import { ZodError } from "zod";

const app = express();

// Security and parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

/**
 * Validation middleware factory using Zod schemas.
 * @param schema - The Zod schema to validate against
 */
const validate = (schema: typeof scrapeProfileSchema) =>
    (req: Request, res: Response, next: NextFunction): void =>
    {
        try
        {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (e)
        {
            if (e instanceof ZodError)
            {
                res.status(400).send(e.errors);
                return;
            }
            next(e);
        }
    };

// API Routes
app.post(
    "/api/v1/profile/scrape",
    validate(scrapeProfileSchema),
    scrapeProfile
);

// GET endpoint for browser access
app.get("/api/v1/profile/scrape", async (req: Request, res: Response) =>
{
    const url = req.query.url as string | undefined;

    if (!url)
    {
        res.status(400).json({
            success: false,
            error: "Missing 'url' query parameter. Usage: /api/v1/profile/scrape?url=https://linkedin.com/in/username/",
        });
        return;
    }

    if (!url.includes("linkedin.com/in/"))
    {
        res.status(400).json({
            success: false,
            error: "Invalid LinkedIn profile URL. Must contain 'linkedin.com/in/'",
        });
        return;
    }

    // Forward to the same handler logic
    req.body = { linkedinUrl: url };
    await scrapeProfile(req as Request<object, object, { linkedinUrl: string }>, res);
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) =>
{
    res.json({ status: "ok" });
});

export default app;

