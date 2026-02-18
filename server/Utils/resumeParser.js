const { GoogleGenerativeAI } = require('@google/generative-ai');

const systemPrompt = `
Convert raw, messy text extracted from a PDF resume into a STRICT, VALID JSON object.
This output will be consumed by automated scoring and semantic matching systems.
Errors or ambiguity will break downstream logic.

You MUST follow the rules exactly.

NON-NEGOTIABLE RULES:
1. OUTPUT FORMAT
- Output ONLY valid JSON
- No markdown
- No explanations
- No comments
- No extra keys

2. DATA INTEGRITY
- DO NOT hallucinate missing information
- If data is missing, return null or an empty array
- Never guess dates, companies, roles, or skills

3. CLEANING
- Remove headers/footers like "Page 1 of 1"
- Remove visual artifacts (||, #, stray symbols)
- Deduplicate repeated name/email/phone
- Merge broken lines into complete sentences

4. SEMANTIC CORRECTNESS (CRITICAL)
- Professional EXPERIENCE ≠ student clubs ≠ volunteering
- Only include PAID / PROFESSIONAL roles in "experience"
- Student clubs, ambassador roles, societies → put in "activities"
- Projects are NOT experience

5. SKILLS (UNIVERSAL - ANY INDUSTRY)
- Skills must be concrete and defensible
- Remove vague buzzwords unless explicitly contextualized
- Normalize skills as lowercase strings
- No duplicates

6. PROJECTS
- Project descriptions MUST be arrays of bullet points
- Preserve meaning, not formatting

7. DETERMINISM
- Follow the schema exactly
- Field types must never change

REQUIRED JSON SCHEMA (STRICT):
{
  "candidate": {
    "name": "string | null",
    "email": "string | null",
    "phone": "string | null",
    "links": ["string"]
  },
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string | null",
      "gpa": "string | null",
      "start": "string | null",
      "end": "string | null"
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string | null",
      "details": ["string"]
    }
  ],
  "activities": [
    {
      "organization": "string",
      "role": "string",
      "duration": "string | null"
    }
  ],
  "skills": {
    "technical": ["string"],
    "domain": ["string"],
    "tools": ["string"],
    "soft": ["string"]
  },
  "projects": [
    {
      "title": "string",
      "tech": ["string"],
      "description": ["string"]
    }
  ],
  "certifications": ["string"]
}

CLASSIFICATION GUIDELINES (UNIVERSAL - ALL INDUSTRIES):
EXPERIENCE: Full-time, part-time, contract, freelance, internships with pay
ACTIVITIES: University clubs, campus ambassador, student leadership, volunteering, unpaid work

SKILLS CATEGORIES (adapt to ANY field):
- Technical: Programming, data analysis, accounting, medical procedures, legal research, manufacturing, design software, etc.
- Domain: Industry knowledge (finance, healthcare, education, marketing, engineering, hospitality, etc.)
- Tools: Software, equipment, platforms (Excel, SAP, AutoCAD, Adobe, medical equipment, machinery, CRM, etc.)
- Soft: Communication, leadership, teamwork, problem-solving, etc.

If unsure about categorization, EXCLUDE the item.

FINAL INSTRUCTION:
If the resume text is noisy or ambiguous:
- Prefer omission over guessing
- Prefer empty arrays over incorrect data
- Precision is more important than completeness

Output the JSON object ONLY.
`;

/**
 * Extract JSON from LLM response (handles markdown backticks)
 * @param {string} text - Raw LLM response
 * @returns {string} Clean JSON string
 */
const extractJSON = (text) => {
  // Remove markdown code blocks if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  // Return as-is if no backticks
  return text.trim();
};

/**
 * Normalize resume text into structured JSON using Gemini Flash
 * @param {string} rawText - Raw text extracted from PDF
 * @returns {Promise<Object>} Structured resume data
 */
const normalizeResume = async (rawText) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `${systemPrompt}\n\nRESUME TEXT:\n${rawText}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanJSON = extractJSON(text);
    const parsed = JSON.parse(cleanJSON);

    return parsed;
  } catch (error) {
    console.error('Gemini API Error Details:', error.message);
    if (error instanceof SyntaxError) {
      throw new Error('LLM_PARSE_ERROR: Failed to parse LLM response as JSON');
    }
    throw new Error(`LLM_API_ERROR: ${error.message}`);
  }
};

module.exports = { normalizeResume };
