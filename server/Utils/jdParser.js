const { HfInference } = require('@huggingface/inference');

const extractJSON = (text) => {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) return jsonMatch[1].trim();
    return text.trim();
};

/**
 * Parses a raw Job Description text into a structured JSON rubric
 * @param {string} jobDescriptionText 
 * @returns {Promise<Object>}
 */
const parseJD = async (jobDescriptionText) => {
    if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY is not configured');
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';

    const prompt = `
You are a Job Description Parsing Engine. Extract structured data from the following job description text.

JOB DESCRIPTION:
"${jobDescriptionText}"

TASK:
Extract the following information:
1. Job Title.
2. Required and nice-to-have skills, tools, and technologies (coreSkills array). Extract AS MANY distinct technical and relevant soft skills as possible (aim for 15-25 if they exist).
3. Minimum years of experience required (experienceYears). If none specified, use 0. If a range is given, use the minimum.
4. Required education level (education). If none specified, use 'Not Specified'.
5. Seniority level of the role (seniorityLevel). Must be one of: "intern", "entry", "mid", "senior", "lead", "executive". Base this on job title keywords, years required, and overall tone:
   - "intern": internship roles
   - "entry": junior, associate, graduate, 0-2 years experience
   - "mid": 2-5 years, no explicit seniority keyword
   - "senior": senior, 5+ years, staff
   - "lead": lead, principal, manager, director
   - "executive": VP, C-level, head of

RULES:
- Output ONLY valid JSON, no markdown.

OUTPUT JSON SCHEMA:
{
  "title": "String",
  "coreSkills": ["String"],
  "experienceYears": Number,
  "education": "String",
  "seniorityLevel": "String (one of: intern, entry, mid, senior, lead, executive)"
}
`;

    try {
        const response = await hf.chatCompletion({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000
        });

        const text = response.choices[0].message.content;
        const cleanJSON = extractJSON(text);
        return JSON.parse(cleanJSON);
    } catch (error) {
        console.error('JD Parser Error:', error.message);
        throw new Error('Failed to parse Job Description');
    }
};

module.exports = { parseJD };
