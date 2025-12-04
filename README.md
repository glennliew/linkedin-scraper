# LinkedIn Profile Scraper & Embedding Service

A service that scrapes LinkedIn profiles, extracts professional keywords, and generates vector embeddings for identity matching.

## How It Works

```
LinkedIn URL → Exa API → Profile Data → GPT-4o-mini → Keywords → text-embedding-3-small → Vector
```

1. **Scrape** - Uses [Exa API](https://exa.ai) to fetch LinkedIn profile data (name, headline, about, experience, education, projects, volunteering, skills, interests)
2. **Extract Keywords** - GPT-4o-mini analyzes the profile and extracts 15 professional keywords
3. **Generate Embedding** - OpenAI's text-embedding-3-small creates a 1536-dimension vector from the keywords

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file:

   ```env
   EXASEARCH_API_KEY=your_exa_api_key
   OPENAI_API_KEY=your_openai_api_key
   PORT=3000
   ```

3. Build and start the server:
   ```bash
   npm run build
   node dist/server.js
   ```

## API Endpoints

### GET /health

Health check endpoint.

### GET /api/v1/profile/scrape

Scrape a profile via browser. Also saves the result to `result.json`.

```
http://localhost:3000/api/v1/profile/scrape?url=https://www.linkedin.com/in/username/
```

### POST /api/v1/profile/scrape

Scrape a profile via API call. Also saves the result to `result.json`.

```bash
curl -X POST http://localhost:3000/api/v1/profile/scrape \
  -H "Content-Type: application/json" \
  -d '{"linkedinUrl": "https://www.linkedin.com/in/username/"}'
```

## Response Format

```json
{
  "success": true,
  "data": {
    "profile": {
      "name": "John Doe",
      "headline": "Software Engineer",
      "about": "Building amazing products...",
      "experience": ["Engineer at Company A", "..."],
      "education": [{ "school": "MIT", "degree": "BS", "fieldOfStudy": "CS" }],
      "projects": [{ "name": "Project X", "description": "..." }],
      "volunteering": [{ "role": "Mentor", "organization": "Code.org" }],
      "skills": ["Python", "React", "..."],
      "interests": ["AI", "Startups"],
      "url": "https://linkedin.com/in/johndoe/",
      "image": "https://..."
    },
    "keywords": [
      "Software Engineering",
      "Full Stack Development",
      "..."
    ],
    "embedding": [0.015, -0.004, 0.007, ...]
  }
}
```

## Tech Stack

- **Exa API** - LinkedIn profile scraping
- **OpenAI GPT-4o-mini** - Keyword extraction
- **OpenAI text-embedding-3-small** - Vector embeddings
- **Express** - API server
- **TypeScript** - Type safety
- **Zod** - Request validation
