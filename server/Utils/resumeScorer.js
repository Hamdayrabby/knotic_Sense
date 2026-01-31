const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Extract JSON from LLM response (handles markdown backticks)
 */
const extractJSON = (text) => {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
        return jsonMatch[1].trim();
    }
    return text.trim();
};

/**
 * Determine quality level from score
 */
const getQualityLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', description: 'Resume is well-optimized and ATS-ready' };
    if (score >= 75) return { level: 'Good', description: 'Strong resume with minor improvements needed' };
    if (score >= 60) return { level: 'Fair', description: 'Resume needs some work to pass ATS filters' };
    return { level: 'Needs Work', description: 'Significant improvements required for ATS compatibility' };
};

/**
 * Score resume for general ATS readiness (WITHOUT Job Description)
 * Uses simpler quality assessment - not weighted rubric
 * @param {Object} resumeStructured - Parsed resume JSON
 * @returns {Promise<Object>} ATS quality assessment
 */
const scoreResume = async (resumeStructured) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const scorePrompt = `
You are a Resume Quality Assessor. Evaluate this resume for GENERAL ATS readiness without any specific job description.

RESUME DATA:
${JSON.stringify(resumeStructured, null, 2)}

QUALITY ASSESSMENT CRITERIA:

1. COMPLETENESS (0-100):
   - All essential sections present (contact, education, experience, skills)
   - No critical missing information
   - Projects and activities add value

2. KEYWORD RICHNESS (0-100):
   - Strong action verbs used
   - Quantified achievements (numbers, percentages, metrics)
   - Industry-relevant terminology
   - Specific rather than vague language

3. FORMAT QUALITY (0-100):
   - Clear structure and organization
   - Consistent formatting
   - Contact info easily identifiable
   - Dates and durations clearly stated

4. OVERALL ATS READINESS (0-100):
   - Balance of the above factors
   - General parsability by ATS systems
   - Professional presentation

TASK:
1. Score each criterion (0-100)
2. Calculate overall score (average of all)
3. Suggest 1-3 job roles that match this profile (ANY industry)
4. List top 3 strengths
5. List top 3 actionable improvements
6. Write a 2-sentence professional summary

RULES:
- Be industry-agnostic (works for tech, healthcare, finance, creative, trades, etc.)
- Base assessment on resume QUALITY, not field-specific requirements
- Output ONLY valid JSON

OUTPUT JSON SCHEMA:
{
  "overallScore": Number (0-100),
  "scoreBreakdown": {
    "completeness": Number (0-100),
    "keywordRichness": Number (0-100),
    "formatQuality": Number (0-100),
    "atsReadiness": Number (0-100)
  },
  "suggestedJobs": ["String"],
  "strengths": ["String"],
  "improvements": ["String"],
  "summary": "String"
}

Output the JSON object ONLY.
`;

    try {
        const result = await model.generateContent(scorePrompt);
        const response = await result.response;
        const text = response.text();

        const cleanJSON = extractJSON(text);
        const parsed = JSON.parse(cleanJSON);

        if (typeof parsed.overallScore !== 'number') {
            throw new Error('Invalid response structure');
        }

        // Get quality level
        const quality = getQualityLevel(parsed.overallScore);

        return {
            overallScore: parsed.overallScore,
            quality,
            scoreBreakdown: parsed.scoreBreakdown || {},
            suggestedJobs: parsed.suggestedJobs || [],
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || [],
            summary: parsed.summary || ''
        };
    } catch (error) {
        console.error('Resume Scorer Error:', error.message);
        if (error instanceof SyntaxError) {
            throw new Error('SCORER_PARSE_ERROR: Failed to parse score result');
        }
        throw new Error(`SCORER_API_ERROR: ${error.message}`);
    }
};

module.exports = { scoreResume };
