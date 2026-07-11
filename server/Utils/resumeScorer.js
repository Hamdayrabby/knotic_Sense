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
You are a STRICT Resume Quality Assessor calibrated to real-world ATS standards. Evaluate this resume for GENERAL ATS readiness without any specific job description.

CRITICAL CALIBRATION RULES:
- You MUST score honestly. Most resumes should score between 40-70.
- A score above 80 is RARE and reserved for exceptional resumes with quantified achievements, strong action verbs, and flawless formatting.
- A score below 40 indicates significant structural or content problems.
- Do NOT be generous. Real ATS systems reject 75% of applications.

RESUME DATA:
${JSON.stringify(resumeStructured, null, 2)}

SCORING RUBRIC (follow strictly):

1. COMPLETENESS (0-100):
   - 90-100: All sections present (contact, summary, education, experience, skills, projects/certs), rich detail
   - 70-89: Most sections present, minor gaps (e.g., no summary or no projects)
   - 50-69: Missing 1-2 important sections or very thin content
   - 30-49: Bare minimum content, multiple missing sections
   - 0-29: Severely incomplete, barely parseable

2. KEYWORD RICHNESS (0-100):
   - 90-100: Extensive quantified achievements (numbers, %, $), strong action verbs (led, built, increased), specific technologies/tools named
   - 70-89: Some quantification, decent action verbs, industry terms present
   - 50-69: Generic descriptions, few numbers, mostly passive voice
   - 30-49: Vague language ("responsible for", "helped with"), no metrics
   - 0-29: No meaningful professional language

3. FORMAT QUALITY (0-100):
   - 90-100: Consistent date formats, clear headers, well-structured bullets (3-5 per role), proper contact info
   - 70-89: Mostly consistent, minor formatting issues
   - 50-69: Inconsistent dates, thin bullets, some structural problems
   - 30-49: Poor structure, missing dates, hard to parse
   - 0-29: No clear structure

4. OVERALL ATS READINESS (0-100):
   - Average of above, adjusted for overall impression
   - A freshly graduated student with projects but no work experience: expect 45-60
   - An experienced professional with quantified achievements: expect 65-80
   - Only truly exceptional resumes with metrics-driven content reach 85+

CALIBRATION ANCHORS (use these as reference):
- Score 30: A resume with just a name, email, and a list of 5 skills. No experience, no projects, no education details.
- Score 50: A typical fresh graduate resume with education, a skills list, 1-2 projects with basic descriptions, no quantified achievements.
- Score 70: A mid-career professional with 3+ roles, some quantified bullets ("increased sales by 15%"), proper formatting, a summary section.
- Score 90: An exceptional resume with consistent metrics in every bullet ("reduced latency by 40%, saving $2M annually"), strong action verbs throughout, comprehensive skills, certifications, and flawless formatting.

TASK:
1. Score each criterion (0-100) using the rubric above
2. Calculate overall score (weighted average: completeness 25%, keyword richness 35%, format quality 20%, ATS readiness 20%)
3. Suggest 1-3 job roles that match this profile (ANY industry)
4. List top 3 strengths (CRITICAL: Write DETAILED, 2-3 sentence explanations for each strength based on explicit facts present in the data. Do not assume or guess abilities.)
5. List top 3 actionable improvements (Give specific, actionable advice in detailed 2-3 sentence paragraphs on how to fix formatting or content.)
6. Write a comprehensive 3-5 sentence professional summary (CRITICAL: Do not hallucinate. Summarize ONLY what is written in the data.)

RULES:
- Be industry-agnostic (works for tech, healthcare, finance, creative, trades, etc.)
- Base assessment on resume QUALITY, not field-specific requirements
- STRICT GROUNDING: If a skill is not in the JSON, they do not have it. Do not invent strengths.
- The overall score MUST be the weighted average, not an arbitrary number
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
