const { HfInference } = require('@huggingface/inference');

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
    if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY is not configured');
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';

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
4. List top 3 strengths (CRITICAL: Write DETAILED, 2-3 sentence explanations for each strength based on explicit facts present in the data. Do not assume or guess abilities.)
5. List top 3 actionable improvements (Give specific, actionable advice in detailed 2-3 sentence paragraphs on how to fix formatting or content.)
6. Write a comprehensive 3-5 sentence professional summary (CRITICAL: Do not hallucinate. Summarize ONLY what is written in the data.)

RULES:
- Be industry-agnostic (works for tech, healthcare, finance, creative, trades, etc.)
- Base assessment on resume QUALITY, not field-specific requirements
- STRICT GROUNDING: If a skill is not in the JSON, they do not have it. Do not invent strengths.
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
  "strengths": ["String (Detailed paragraph)"],
  "improvements": ["String (Detailed actionable paragraph)"],
  "summary": "String (Comprehensive summary paragraph)"
}

Output the JSON object ONLY.
`;

    try {
        const response = await hf.chatCompletion({
            model: model,
            messages: [{ role: 'user', content: scorePrompt }],
            max_tokens: 4000
        });

        const text = response.choices[0].message.content;

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
