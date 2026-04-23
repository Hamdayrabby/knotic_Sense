/**
 * Finds a snippet of text surrounding a matched keyword for proof
 */
const findProofQuote = (keyword, stringifiedResume) => {
    const lowerResume = stringifiedResume.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    const idx = lowerResume.indexOf(lowerKeyword);
    if (idx === -1) return "Implicitly found in profile details.";

    // Grab a ~60 char window around the keyword
    const start = Math.max(0, idx - 30);
    const end = Math.min(stringifiedResume.length, idx + keyword.length + 30);

    let quote = stringifiedResume.substring(start, end);
    // Clean up cutoff words
    quote = quote.replace(/^[^\s]*\s/, '...').replace(/\s[^\s]*$/, '...');

    // Return original casing snippet if possible, else just the substring
    return quote;
};

/**
 * Normalizes a string for more forgiving matching (removes spaces, dots, dashes)
 */
const normalizeString = (str) => {
    if (!str) return '';
    return str.toLowerCase().replace(/[\s\.\-]+/g, '');
};

/**
 * Deterministically match a resume against a structured JD
 * @param {Object} resumeStructured - Custom parsed resume JSON
 * @param {Object} jdStructured - Custom parsed JD JSON
 * @returns {Object} Score metrics
 */
const calculateDeterministicScore = (resumeStructured, jdStructured) => {
    let scoreBreakdown = {
        keywordScore: 0,
        skillsScore: 0,
        experienceScore: 0,
        educationScore: 0,
        formatScore: 5 // Default format score base
    };

    let matchedKeywords = [];
    let missingKeywords = [];

    const stringifiedResume = JSON.stringify(resumeStructured);
    const lowerResumeString = stringifiedResume.toLowerCase();
    const normalizedResumeStr = normalizeString(stringifiedResume);

    // 1. SKILLS & KEYWORDS (Combined weight 70%)
    const requiredSkills = jdStructured.coreSkills || [];
    let matchedCount = 0;

    requiredSkills.forEach(reqSkill => {
        const lowerSkill = reqSkill.toLowerCase();
        const normalizedSkill = normalizeString(reqSkill);

        // Exact match check on original or normalized
        if (lowerResumeString.includes(lowerSkill) || (normalizedSkill.length > 2 && normalizedResumeStr.includes(normalizedSkill))) {
            matchedCount++;
            matchedKeywords.push({
                keyword: reqSkill,
                proofQuote: findProofQuote(reqSkill, stringifiedResume)
            });
        } else {
            missingKeywords.push(reqSkill);
        }
    });

    // ATS systems know JDs are exhaustive wishlists. We curve the skill matching proportionally:
    // A perfect technical fit usually exhibits ~70% of a long wishlist.
    const targetSkills = Math.max(
        Math.min(requiredSkills.length, 8), // If they ask for < 8, target is all of them
        Math.floor(requiredSkills.length * 0.7) // Otherwise aim for 70% of the long wishlist
    );
    const denominator = targetSkills;
    const skillMatchPercentage = denominator > 0 ? Math.min(1.0, matchedCount / denominator) : 1;

    // Assign 45% keyword, 25% skills
    scoreBreakdown.keywordScore = Math.round(skillMatchPercentage * 45);
    scoreBreakdown.skillsScore = Math.round(skillMatchPercentage * 25);

    // 2. EXPERIENCE (15%)
    let expYears = 0;
    if (resumeStructured.experience && Array.isArray(resumeStructured.experience)) {
        // Deterministic heuristic: Add 2 years for each discrete role listed 
        // Real ATS parses dates exactly, but this simulates the weight mechanic
        expYears += (resumeStructured.experience.length * 2);
    }
    const requiredExp = typeof jdStructured.experienceYears === 'number' ? jdStructured.experienceYears : 0;
    if (requiredExp === 0 || expYears >= requiredExp) {
        scoreBreakdown.experienceScore = 15;
    } else {
        scoreBreakdown.experienceScore = Math.round((expYears / requiredExp) * 15);
    }

    // 3. EDUCATION (10%)
    let eduScore = 4; // Unrelated baseline
    const reqEdu = (jdStructured.education || "").toLowerCase();
    const resumeEduStr = JSON.stringify(resumeStructured.education || []).toLowerCase();

    // Check if JD mentions common degree requirement words
    const requiresDegree = reqEdu.match(/\b(bachelor|master|degree|bs|ba|ms|phd)\b/i);

    if (requiresDegree) {
        const hasDegree = resumeEduStr.match(/\b(bachelor|bs|bsc|ba|master|ms|msc|phd)\b/i);
        if (hasDegree) {
            // Extract distinct field words from JD (ignore common generic words)
            const stopWords = ["bachelor", "master", "degree", "of", "in", "or", "related", "field", "bs", "ba", "ms", "phd", "and", "the", "a", "an", "for"];
            const reqEduWords = reqEdu.split(/[\s,.\/]+/).filter(w => w.length > 2 && !stopWords.includes(w));

            // If the JD didn't specify a field, just a degree, then full points.
            if (reqEduWords.length === 0) {
                eduScore = 10;
            } else {
                // Check if any specific field words from JD appear in the resume education
                const hasRelatedField = reqEduWords.some(word => resumeEduStr.includes(word));
                if (hasRelatedField) {
                    eduScore = 10; // Related degree -> full
                } else {
                    eduScore = 8; // Degree achieved but strictly unrelated
                }
            }
        }
    } else {
        eduScore = 10; // Not explicitly required, give benefit of doubt
    }
    scoreBreakdown.educationScore = eduScore;

    // 4. FORMATTING (5%)
    let formatScore = 0;
    if (resumeStructured.summary && resumeStructured.summary.length > 20) formatScore += 1;
    if (resumeStructured.personalInfo && (resumeStructured.personalInfo.email || resumeStructured.personalInfo.phone)) formatScore += 1;
    if (resumeStructured.experience && resumeStructured.experience.length > 0) formatScore += 1;
    if (resumeStructured.education && resumeStructured.education.length > 0) formatScore += 1;
    // Projects or Skills section
    if ((resumeStructured.projects && resumeStructured.projects.length > 0) || (resumeStructured.skills && resumeStructured.skills.length > 0)) formatScore += 1;
    scoreBreakdown.formatScore = formatScore;

    // 5. ROBOTIC DETECTION (Deterministic Anti-Stuffing)
    let roboticFlag = false;
    let maxRepetitions = 0;
    requiredSkills.forEach(reqSkill => {
        if (reqSkill.length > 3) {
            const occurrences = lowerResumeString.split(reqSkill.toLowerCase()).length - 1;
            if (occurrences > maxRepetitions) maxRepetitions = occurrences;
        }
    });
    // Flag if a single keyword is stuffed 10+ times, or if the resume is artificially massively long
    if (maxRepetitions > 10 || stringifiedResume.length > 15000) {
        roboticFlag = true;
    }

    const totalScore =
        scoreBreakdown.keywordScore +
        scoreBreakdown.skillsScore +
        scoreBreakdown.experienceScore +
        scoreBreakdown.educationScore +
        scoreBreakdown.formatScore;

    // Normalize 0-100 scores for the precise UI gauge rings
    scoreBreakdown.keywords = Math.round(skillMatchPercentage * 100);
    scoreBreakdown.skills = Math.round(skillMatchPercentage * 100);
    scoreBreakdown.experience = Math.round((scoreBreakdown.experienceScore / 15) * 100);
    scoreBreakdown.education = Math.round((scoreBreakdown.educationScore / 10) * 100);
    scoreBreakdown.formatting = Math.round((scoreBreakdown.formatScore / 5) * 100);
    scoreBreakdown.profile = 100;

    return {
        totalScore: Math.min(100, Math.max(0, totalScore)),
        scoreBreakdown,
        matchedKeywords,
        missingKeywords,
        roboticFlag
    };
};

module.exports = { calculateDeterministicScore };
