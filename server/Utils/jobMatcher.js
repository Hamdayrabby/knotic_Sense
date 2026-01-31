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
 * Match resume against job description with weighted scoring
 * @param {Object} resumeStructured - Parsed resume JSON
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} Weighted match analysis result
 */
const matchResumeToJob = async (resumeStructured, jobDescription) => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const matchPrompt = `
You are an ATS (Applicant Tracking System) Scoring Engine. Your job is to calculate a PRECISE match score between a resume and job description using STRICT weighted criteria.

CANDIDATE RESUME:
${JSON.stringify(resumeStructured, null, 2)}

JOB DESCRIPTION:
"${jobDescription}"

WEIGHTED SCORING RUBRIC (Total 100%):

1. KEYWORD MATCHING (45% weight):
   - Find EXACT keyword matches between JD requirements and resume
   - Prioritize word-for-word matches over synonyms
   - For EACH keyword match, QUOTE the exact sentence from the resume that proves it
   - Score: (matched keywords / total required keywords) × 45

2. SKILLS MATCH (25% weight):
   - Focus on HARD SKILLS and technical tools only
   - Ignore soft skills for this section
   - Check skills section, project descriptions, and experience details
   - Score: (matched skills / required skills) × 25

3. EXPERIENCE ALIGNMENT (15% weight):
   - Compare years of experience required vs years proven
   - Check if role titles align with the position
   - Score based on relevance and duration match
   - Score: alignment percentage × 15

4. EDUCATION & CERTIFICATIONS (10% weight):
   - Check if required degree/field matches
   - Look for relevant certifications mentioned in JD
   - Score: (matched requirements / total requirements) × 10

5. FORMAT & DATA HEALTH (5% weight):
   - Deduct points for: missing contact info, missing sections, chaotic structure
   - Full points if resume is complete and well-structured
   - Score: health percentage × 5

ROBOTIC DETECTION:
- If total score >= 95, set roboticFlag: true
- This indicates possible keyword stuffing
- Provide advice to make the resume sound more human

STAR RATING PILLARS (for dual-rating):
Calculate separate scores (0-100) for:
- Profile: Contact info, summary, links completeness
- Education: Degree match, certifications
- Experience: Role relevance, years, achievements
- Skills: Technical skill coverage

RULES:
- Be STRICT and mathematical
- QUOTE resume sentences as proof for matches
- Synonyms count for 50% value of exact matches
- Output ONLY valid JSON, no markdown

OUTPUT JSON SCHEMA:
{
  "totalScore": Number (0-100),
  "scoreBreakdown": {
    "keywordScore": Number (0-45),
    "skillsScore": Number (0-25),
    "experienceScore": Number (0-15),
    "educationScore": Number (0-10),
    "formatScore": Number (0-5),
    "profile": Number (0-100),
    "education": Number (0-100),
    "experience": Number (0-100),
    "skills": Number (0-100)
  },
  "matchedKeywords": [
    { "keyword": "String", "proofQuote": "String (exact sentence from resume)" }
  ],
  "missingKeywords": ["String"],
  "roboticFlag": Boolean,
  "phrasingSuggestions": [
    { "current": "String (what resume says)", "suggested": "String (what JD uses)", "reason": "String" }
  ],
  "strengths": ["String"],
  "improvements": ["String"],
  "reasoning": "String (2-3 sentences explaining the score)"
}

Output the JSON object ONLY.
`;

    try {
        const result = await model.generateContent(matchPrompt);
        const response = await result.response;
        const text = response.text();

        const cleanJSON = extractJSON(text);
        const parsed = JSON.parse(cleanJSON);

        // Validate required fields
        if (typeof parsed.totalScore !== 'number') {
            throw new Error('Invalid response structure');
        }

        // Calculate star rating
        const starRating = calculateStarRating({
            profile: parsed.scoreBreakdown?.profile || 0,
            education: parsed.scoreBreakdown?.education || 0,
            experience: parsed.scoreBreakdown?.experience || 0,
            skills: parsed.scoreBreakdown?.skills || 0
        });

        // Get visibility zone
        const visibility = getVisibilityZone(parsed.totalScore);

        return {
            score: parsed.totalScore,
            starRating,
            visibility,
            scoreBreakdown: parsed.scoreBreakdown || {},
            matchedKeywords: parsed.matchedKeywords || [],
            missingKeywords: parsed.missingKeywords || [],
            roboticFlag: parsed.roboticFlag || false,
            roboticAdvice: parsed.roboticFlag ?
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

module.exports = { matchResumeToJob };
