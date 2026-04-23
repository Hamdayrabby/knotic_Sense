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
 * Calculate star rating from percentage score
 */
const calculateStarRating = (scoreBreakdown) => {
    const { profile, education, experience, skills } = scoreBreakdown;
    // Each pillar contributes to max 1.25 stars (total 5 stars)
    const stars = (
        (profile / 100) * 1.25 +
        (education / 100) * 1.25 +
        (experience / 100) * 1.25 +
        (skills / 100) * 1.25
    );
    return Math.round(stars * 10) / 10; // Round to 1 decimal
};

/**
 * Determine visibility zone from score
 */
const getVisibilityZone = (score) => {
    if (score >= 90) return { zone: 'Very High', description: 'High likelihood of recruiter visibility' };
    if (score >= 75) return { zone: 'Good/Excellent', description: 'Ideal Zone - optimized but natural' };
    if (score >= 60) return { zone: 'Borderline', description: 'Maybe zone - depends on candidate pool size' };
    return { zone: 'Low', description: 'High risk of automatic rejection' };
};

/**
 * Generate qualitative LLM feedback based on deterministic match scores
 */
const generateMatchFeedback = async (resumeStructured, jobDescription, scoreMetrics) => {
    if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY is not configured');
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';

    const matchPrompt = `
You are an Expert ATS AI Advisory Layer. A deterministic JavaScript backend engine has already scored a candidate's resume against a job description.
Your task is ONLY to provide qualitative, strategic feedback based STRICTLY on the engine's hard metrics. Do not recalculate scores.

DETERMINISTIC METRICS (DO NOT RECALCULATE):
- Total Score: ${scoreMetrics.totalScore}/100
- Missing Critical Skills: ${JSON.stringify(scoreMetrics.missingKeywords)}
- Matched Skills: ${JSON.stringify(scoreMetrics.matchedKeywords.map(k => k.keyword))}

CANDIDATE RESUME:
${JSON.stringify(resumeStructured, null, 2)}

JOB DESCRIPTION:
"${jobDescription}"

TASK:
1. 'phrasingSuggestions': Identify 1-3 bullet points in the resume that could be rewritten to better target the JD.
2. 'strengths': Write 2-3 DETAILED paragraphs explaining the candidate's strongest alignments with the role.
3. 'improvements': Write 2-3 DETAILED paragraphs with actionable advice on how to address the 'Missing Critical Skills' or formatting gaps.
4. 'reasoning': Write a comprehensive 3-5 sentence professional summary evaluating their overall fit based on the deterministic metrics.

RULES:
- Trust the Deterministic Metrics perfectly. Do not claim a skill is matched if it is in the Missing list.
- Do not output scores or math.
- Output ONLY valid JSON, no markdown.

OUTPUT JSON SCHEMA:
{
  "phrasingSuggestions": [
    { "current": "String", "suggested": "String", "reason": "String" }
  ],
  "strengths": ["String (Detailed paragraph)"],
  "improvements": ["String (Detailed actionable paragraph)"],
  "reasoning": "String (Comprehensive summary paragraph)"
}
`;

    try {
        const response = await hf.chatCompletion({
            model: model,
            messages: [{ role: 'user', content: matchPrompt }],
            max_tokens: 4000
        });

        const text = response.choices[0].message.content;

        const cleanJSON = extractJSON(text);
        let parsed = { phrasingSuggestions: [], strengths: [], improvements: [], reasoning: '' };

        try {
            parsed = JSON.parse(cleanJSON);
        } catch (e) {
            console.error("Failed to parse LLM Feedback. Using fallback.", e);
        }

        // Calculate star rating and UI metadata
        const starRating = calculateStarRating({
            profile: scoreMetrics.scoreBreakdown.profile || 0,
            education: scoreMetrics.scoreBreakdown.education || 0,
            experience: scoreMetrics.scoreBreakdown.experience || 0,
            skills: scoreMetrics.scoreBreakdown.skills || 0
        });

        const visibility = getVisibilityZone(scoreMetrics.totalScore);
        const roboticFlag = scoreMetrics.roboticFlag || false;

        // Combine the deterministic metrics with the AI feedback into the standard UI schema
        return {
            score: scoreMetrics.totalScore,
            starRating,
            visibility,
            scoreBreakdown: scoreMetrics.scoreBreakdown || {},
            matchedKeywords: scoreMetrics.matchedKeywords || [],
            missingKeywords: scoreMetrics.missingKeywords || [],
            roboticFlag,
            roboticAdvice: roboticFlag ?
                'Your resume appears over-optimized. Consider making the language more natural to pass human review.' : null,
            phrasingSuggestions: parsed.phrasingSuggestions || [],
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || [],
            reasoning: parsed.reasoning || ''
        };
    } catch (error) {
        console.error('Job Matcher Error:', error.message);
        if (error instanceof SyntaxError) {
            throw new Error('MATCHER_PARSE_ERROR: Failed to parse match result');
        }
        throw new Error(`MATCHER_API_ERROR: ${error.message}`);
    }
};

module.exports = { generateMatchFeedback };
