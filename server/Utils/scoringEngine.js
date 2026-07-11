/**
 * World-Class Deterministic ATS Scoring Engine
 * 
 * Weights:
 *   Hard Skills Match:      40%
 *   Experience Alignment:   25%
 *   Education Fit:          15%
 *   Resume Quality:         15%
 *   Formatting/Parsability:  5%
 * 
 * Design Principles:
 *   - No curves or bonuses — score what's actually there
 *   - Fair to freshers — projects carry partial experience credit
 *   - Word-boundary keyword matching — no substring false positives
 *   - Realistic calibration — a typical applicant scores 50-65, not 80+
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Finds a snippet of text surrounding a matched keyword for proof
 */
const findProofQuote = (keyword, resumeText) => {
    const lowerResume = resumeText.toLowerCase();
    const lowerKeyword = keyword.toLowerCase();

    const idx = lowerResume.indexOf(lowerKeyword);
    if (idx === -1) return 'Found via normalized matching.';

    const start = Math.max(0, idx - 30);
    const end = Math.min(resumeText.length, idx + keyword.length + 30);

    let quote = resumeText.substring(start, end);
    quote = quote.replace(/^\S*\s/, '...').replace(/\s\S*$/, '...');
    return quote;
};

/**
 * Flatten all text content from a resume object into a readable string
 * (NOT JSON.stringify — avoids matching JSON keys like "description", "technical")
 */
const flattenResumeText = (resume) => {
    const parts = [];

    // Candidate info
    if (resume.candidate) {
        const c = resume.candidate;
        if (c.name) parts.push(c.name);
        if (c.email) parts.push(c.email);
        if (c.links) parts.push(...c.links);
    }

    // Legacy personalInfo support
    if (resume.personalInfo) {
        const p = resume.personalInfo;
        if (p.name) parts.push(p.name);
        if (p.email) parts.push(p.email);
    }

    // Summary
    if (resume.summary) parts.push(resume.summary);

    // Experience
    if (resume.experience && Array.isArray(resume.experience)) {
        resume.experience.forEach(exp => {
            if (exp.company) parts.push(exp.company);
            if (exp.role) parts.push(exp.role);
            if (exp.duration) parts.push(exp.duration);
            if (exp.details) parts.push(...exp.details);
        });
    }

    // Education
    if (resume.education && Array.isArray(resume.education)) {
        resume.education.forEach(edu => {
            if (edu.institution) parts.push(edu.institution);
            if (edu.degree) parts.push(edu.degree);
            if (edu.field) parts.push(edu.field);
        });
    }

    // Projects
    if (resume.projects && Array.isArray(resume.projects)) {
        resume.projects.forEach(proj => {
            if (proj.title) parts.push(proj.title);
            if (proj.tech) parts.push(...proj.tech);
            if (proj.description) parts.push(...proj.description);
        });
    }

    // Skills (all categories)
    if (resume.skills) {
        const s = resume.skills;
        if (Array.isArray(s)) {
            parts.push(...s);
        } else {
            if (s.technical) parts.push(...s.technical);
            if (s.domain) parts.push(...s.domain);
            if (s.tools) parts.push(...s.tools);
            if (s.soft) parts.push(...s.soft);
        }
    }

    // Certifications
    if (resume.certifications) parts.push(...resume.certifications);

    // Activities
    if (resume.activities && Array.isArray(resume.activities)) {
        resume.activities.forEach(act => {
            if (act.organization) parts.push(act.organization);
            if (act.role) parts.push(act.role);
        });
    }

    return parts.filter(Boolean).join(' ');
};

/**
 * Check if a keyword matches using word-boundary regex
 * Handles multi-word skills, acronyms, and special chars
 */
const keywordMatches = (keyword, text) => {
    const trimmed = keyword.trim();
    if (!trimmed || trimmed.length < 2) return false;

    try {
        // For very short terms (2-3 chars like "Go", "R", "C"), require exact word boundary
        // For longer terms, allow more flexible matching
        const escaped = escapeRegex(trimmed);
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
    } catch {
        // Fallback: direct case-insensitive includes for complex strings
        return text.toLowerCase().includes(trimmed.toLowerCase());
    }
};

/**
 * Parse a duration string like "Jan 2022 - Aug 2023" into fractional years
 * Returns 0 if unparseable
 */
const parseDurationYears = (durationStr) => {
    if (!durationStr || typeof durationStr !== 'string') return 0;

    const clean = durationStr.trim().toLowerCase();

    // Check for "present" / "current"
    const isOngoing = /present|current|now|ongoing/i.test(clean);

    // Common month names
    const monthMap = {
        jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
        apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
        aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
        nov: 10, november: 10, dec: 11, december: 11
    };

    // Try to find two date-like tokens separated by – / - / "to"
    // Use alternation: dashes OR the word "to" (with word boundaries to avoid matching inside words)
    const parts = clean.split(/\s*[-–—]+\s*|\s+to\s+/);
    if (parts.length < 2) {
        // Try "X years" pattern
        const yearsMatch = clean.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
        if (yearsMatch) return parseFloat(yearsMatch[1]);

        // Try "X months" pattern
        const monthsMatch = clean.match(/(\d+)\s*(?:months?|mos?)/i);
        if (monthsMatch) return parseInt(monthsMatch[1]) / 12;

        return 0;
    }

    const parseDate = (str) => {
        const s = str.trim();
        if (/present|current|now|ongoing/i.test(s)) return new Date();

        // "Month Year" pattern: "Jan 2022", "January 2022"
        const monthYear = s.match(/([a-z]+)\s*[,.]?\s*(\d{4})/i);
        if (monthYear) {
            const m = monthMap[monthYear[1].toLowerCase()];
            if (m !== undefined) return new Date(parseInt(monthYear[2]), m, 15);
        }

        // "Year" only: "2022"
        const yearOnly = s.match(/\b(\d{4})\b/);
        if (yearOnly) return new Date(parseInt(yearOnly[1]), 6, 1); // Mid-year estimate

        // "MM/YYYY" or "MM-YYYY"
        const mmyyyy = s.match(/(\d{1,2})[/\-](\d{4})/);
        if (mmyyyy) return new Date(parseInt(mmyyyy[2]), parseInt(mmyyyy[1]) - 1, 15);

        return null;
    };

    const startDate = parseDate(parts[0]);
    const endDate = parseDate(parts[1]);

    if (!startDate || !endDate) return 0;

    const diffMs = endDate - startDate;
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, Math.round(years * 10) / 10); // Round to 1 decimal
};

/**
 * Count quantified achievements (numbers, percentages, dollar amounts) in text
 */
const countQuantifiedAchievements = (details) => {
    if (!details || !Array.isArray(details)) return 0;
    let count = 0;
    const quantPattern = /\b(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(%|percent|users|clients|customers|projects|team|members|revenue|sales)/i;
    const dollarPattern = /\$\d/;
    const multiplierPattern = /\b\d+x\b/i;
    const bigNumberPattern = /\b\d{2,}\b/; // Any number with 2+ digits

    details.forEach(detail => {
        if (quantPattern.test(detail) || dollarPattern.test(detail) || multiplierPattern.test(detail)) {
            count++;
        } else if (bigNumberPattern.test(detail)) {
            count += 0.5; // Partial credit for numbers without clear context
        }
    });
    return count;
};

/**
 * Common strong action verbs used in professional resumes
 */
const ACTION_VERBS = new Set([
    'led', 'managed', 'developed', 'built', 'designed', 'implemented', 'created',
    'established', 'launched', 'increased', 'reduced', 'improved', 'optimized',
    'delivered', 'architected', 'engineered', 'automated', 'streamlined', 'spearheaded',
    'orchestrated', 'transformed', 'drove', 'achieved', 'generated', 'negotiated',
    'mentored', 'supervised', 'coordinated', 'analyzed', 'researched', 'collaborated',
    'executed', 'initiated', 'resolved', 'accelerated', 'consolidated', 'pioneered',
    'configured', 'deployed', 'integrated', 'migrated', 'refactored', 'scaled',
    'diagnosed', 'facilitated', 'formulated', 'restructured', 'secured'
]);

/**
 * Count how many bullet points start with strong action verbs
 */
const countActionVerbs = (details) => {
    if (!details || !Array.isArray(details)) return 0;
    let count = 0;
    details.forEach(detail => {
        const firstWord = detail.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
        if (ACTION_VERBS.has(firstWord)) count++;
    });
    return count;
};


// ─── Main Scoring Function ──────────────────────────────────────────────────

/**
 * Deterministically match a resume against a structured JD
 * @param {Object} resumeStructured - Parsed resume JSON
 * @param {Object} jdStructured - Parsed JD JSON
 * @returns {Object} Score metrics
 */
const calculateDeterministicScore = (resumeStructured, jdStructured) => {
    const resume = resumeStructured;
    const jd = jdStructured;

    const resumeText = flattenResumeText(resume);

    // Determine seniority context for adaptive weighting
    const seniorityLevel = jd.seniorityLevel || 'mid';
    const isEntryLevel = seniorityLevel === 'entry' || seniorityLevel === 'intern';
    const requiredExp = typeof jd.experienceYears === 'number' ? jd.experienceYears : 0;
    const hasNoExperience = !resume.experience || resume.experience.length === 0;

    // Adaptive weights: shift education weight up for entry-level if candidate has no experience
    let W_SKILLS = 40, W_EXPERIENCE = 25, W_EDUCATION = 15, W_QUALITY = 15, W_FORMAT = 5;
    if (isEntryLevel && hasNoExperience) {
        // Borrow 10 from experience, give 5 to education and 5 to quality
        W_EXPERIENCE = 15;
        W_EDUCATION = 20;
        W_QUALITY = 20;
    }

    let matchedKeywords = [];
    let missingKeywords = [];

    // ═══════════════════════════════════════════════════════════════════════
    // 1. HARD SKILLS MATCH (W_SKILLS% — default 40%)
    // ═══════════════════════════════════════════════════════════════════════

    const requiredSkills = jd.coreSkills || [];
    let matchedCount = 0;

    requiredSkills.forEach(reqSkill => {
        if (keywordMatches(reqSkill, resumeText)) {
            matchedCount++;
            matchedKeywords.push({
                keyword: reqSkill,
                proofQuote: findProofQuote(reqSkill, resumeText)
            });
        } else {
            missingKeywords.push(reqSkill);
        }
    });

    // Straight ratio — no curving. Match 10/20 = 50%, not 100%.
    const skillRatio = requiredSkills.length > 0
        ? matchedCount / requiredSkills.length
        : 0;
    const skillsRawScore = Math.round(skillRatio * W_SKILLS);

    // ═══════════════════════════════════════════════════════════════════════
    // 2. EXPERIENCE ALIGNMENT (W_EXPERIENCE% — default 25%)
    // ═══════════════════════════════════════════════════════════════════════

    let totalExpYears = 0;
    let totalBullets = 0;
    let allDetails = [];

    if (resume.experience && Array.isArray(resume.experience)) {
        resume.experience.forEach(exp => {
            const years = parseDurationYears(exp.duration);
            totalExpYears += years;
            if (exp.details && Array.isArray(exp.details)) {
                totalBullets += exp.details.length;
                allDetails.push(...exp.details);
            }
        });
    }

    let experienceRatio;
    if (requiredExp === 0) {
        // JD doesn't specify experience requirement
        // Give credit based on having any experience, but cap at 80% (not free 100%)
        if (totalExpYears >= 2) {
            experienceRatio = 0.8;
        } else if (totalExpYears > 0) {
            experienceRatio = 0.5 + (totalExpYears / 2) * 0.3;
        } else if (resume.projects && resume.projects.length >= 2) {
            // Fresher with projects — partial credit
            experienceRatio = 0.35;
        } else {
            experienceRatio = 0.15;
        }
    } else {
        // JD specifies experience requirement
        if (totalExpYears >= requiredExp) {
            experienceRatio = 1.0;
        } else if (totalExpYears >= requiredExp * 0.5) {
            // 50-99% of required: proportional
            experienceRatio = totalExpYears / requiredExp;
        } else {
            // Less than 50%: steep penalty
            experienceRatio = (totalExpYears / requiredExp) * 0.7;

            // Project substitution for freshers: up to +0.15
            if (hasNoExperience && resume.projects && resume.projects.length > 0) {
                const projectTechText = resume.projects.map(p =>
                    [...(p.tech || []), ...(p.description || [])].join(' ')
                ).join(' ');
                // Check how many JD skills appear in projects
                let projectSkillHits = 0;
                requiredSkills.forEach(skill => {
                    if (keywordMatches(skill, projectTechText)) projectSkillHits++;
                });
                const projectRelevance = requiredSkills.length > 0
                    ? projectSkillHits / requiredSkills.length
                    : 0;
                experienceRatio += Math.min(0.15, projectRelevance * 0.25);
            }
        }
    }

    const experienceRawScore = Math.round(Math.min(1.0, experienceRatio) * W_EXPERIENCE);

    // ═══════════════════════════════════════════════════════════════════════
    // 3. EDUCATION FIT (W_EDUCATION% — default 15%)
    // ═══════════════════════════════════════════════════════════════════════

    const reqEdu = (jd.education || '').toLowerCase();
    const resumeEduStr = JSON.stringify(resume.education || []).toLowerCase();

    // Degree hierarchy for comparison
    const degreeLevel = (text) => {
        if (/\b(phd|doctorate|doctoral)\b/i.test(text)) return 4;
        if (/\b(master|ms|msc|ma|mba|m\.s\.|m\.a\.)\b/i.test(text)) return 3;
        if (/\b(bachelor|bs|bsc|ba|b\.s\.|b\.a\.|undergraduate)\b/i.test(text)) return 2;
        if (/\b(associate|diploma|certificate)\b/i.test(text)) return 1;
        return 0;
    };

    const requiresDegree = reqEdu.match(/\b(bachelor|master|degree|bs|ba|ms|phd|doctorate|diploma|associate)\b/i);
    let educationRatio;

    if (!requiresDegree || reqEdu.includes('not specified') || reqEdu.length < 3) {
        // JD doesn't specify education — neutral score, not free points
        const hasDegree = resumeEduStr.match(/\b(bachelor|bs|bsc|ba|master|ms|msc|phd)\b/i);
        educationRatio = hasDegree ? 0.75 : 0.5;
    } else {
        const requiredLevel = degreeLevel(reqEdu);
        const candidateLevel = degreeLevel(resumeEduStr);

        if (candidateLevel === 0) {
            // No degree found when one is required
            educationRatio = 0.1;
        } else if (candidateLevel < requiredLevel) {
            // Lower degree than required
            educationRatio = 0.3;
        } else {
            // Has required degree level or higher — check field match
            const stopWords = new Set(['bachelor', 'master', 'degree', 'of', 'in', 'or', 'related',
                'field', 'bs', 'ba', 'ms', 'phd', 'and', 'the', 'a', 'an', 'for', 'equivalent',
                'preferred', 'required', 'minimum', 'education', 'not', 'specified']);
            const reqEduWords = reqEdu.split(/[\s,./]+/)
                .filter(w => w.length > 2 && !stopWords.has(w));

            if (reqEduWords.length === 0) {
                // JD just says "Bachelor's degree" with no field — full credit for having the degree
                educationRatio = 1.0;
            } else {
                const hasRelatedField = reqEduWords.some(word => resumeEduStr.includes(word));
                if (hasRelatedField) {
                    educationRatio = 1.0; // Exact degree + related field
                } else {
                    educationRatio = 0.55; // Right level, unrelated field
                }
            }
        }
    }

    const educationRawScore = Math.round(educationRatio * W_EDUCATION);

    // ═══════════════════════════════════════════════════════════════════════
    // 4. RESUME QUALITY (W_QUALITY% — default 15%)
    // ═══════════════════════════════════════════════════════════════════════

    // Collect all bullet points from experience and projects
    let allBullets = [...allDetails];
    if (resume.projects && Array.isArray(resume.projects)) {
        resume.projects.forEach(proj => {
            if (proj.description) allBullets.push(...proj.description);
        });
    }

    let qualityPoints = 0;
    const maxQualityPoints = 15; // We'll score out of 15 then normalize

    // 4a. Quantified achievements (0-5 points)
    const quantCount = countQuantifiedAchievements(allBullets);
    qualityPoints += Math.min(5, quantCount); // 1 point per quantified achievement, max 5

    // 4b. Action verb usage (0-3 points)
    const actionVerbCount = countActionVerbs(allBullets);
    if (allBullets.length > 0) {
        const actionVerbRatio = actionVerbCount / allBullets.length;
        if (actionVerbRatio >= 0.6) qualityPoints += 3;
        else if (actionVerbRatio >= 0.3) qualityPoints += 2;
        else if (actionVerbRatio > 0) qualityPoints += 1;
    }

    // 4c. Bullet point density — at least 3 bullets per role (0-3 points)
    if (resume.experience && resume.experience.length > 0) {
        const avgBullets = totalBullets / resume.experience.length;
        if (avgBullets >= 4) qualityPoints += 3;
        else if (avgBullets >= 3) qualityPoints += 2;
        else if (avgBullets >= 1) qualityPoints += 1;
    }

    // 4d. Summary / objective presence and quality (0-2 points)
    if (resume.summary && resume.summary.length > 50) {
        qualityPoints += 2;
    } else if (resume.summary && resume.summary.length > 15) {
        qualityPoints += 1;
    }

    // 4e. Skills section richness (0-2 points)
    let totalSkills = 0;
    if (resume.skills) {
        if (Array.isArray(resume.skills)) {
            totalSkills = resume.skills.length;
        } else {
            totalSkills = (resume.skills.technical?.length || 0) +
                          (resume.skills.domain?.length || 0) +
                          (resume.skills.tools?.length || 0) +
                          (resume.skills.soft?.length || 0);
        }
    }
    if (totalSkills >= 10) qualityPoints += 2;
    else if (totalSkills >= 5) qualityPoints += 1;

    const qualityRatio = qualityPoints / maxQualityPoints;
    const qualityRawScore = Math.round(qualityRatio * W_QUALITY);

    // ═══════════════════════════════════════════════════════════════════════
    // 5. FORMATTING / PARSABILITY (W_FORMAT% — default 5%)
    // ═══════════════════════════════════════════════════════════════════════

    let formatPoints = 0;
    const maxFormatPoints = 5;

    // Contact info present
    const candidate = resume.candidate || resume.personalInfo || {};
    if (candidate.email) formatPoints += 1;
    if (candidate.phone) formatPoints += 0.5;
    if (candidate.name) formatPoints += 0.5;

    // Has properly structured experience with dates
    if (resume.experience && resume.experience.length > 0) {
        const hasDateInExp = resume.experience.some(e => e.duration && e.duration.length > 3);
        if (hasDateInExp) formatPoints += 1;
    }

    // Has education section
    if (resume.education && resume.education.length > 0) formatPoints += 0.5;

    // Has skills section
    if (totalSkills > 0) formatPoints += 0.5;

    // Has projects or certifications (bonus structure)
    if ((resume.projects && resume.projects.length > 0) ||
        (resume.certifications && resume.certifications.length > 0)) {
        formatPoints += 1;
    }

    const formatRatio = Math.min(1, formatPoints / maxFormatPoints);
    const formatRawScore = Math.round(formatRatio * W_FORMAT);

    // ═══════════════════════════════════════════════════════════════════════
    // 6. ROBOTIC DETECTION (Anti-Stuffing)
    // ═══════════════════════════════════════════════════════════════════════

    let roboticFlag = false;
    let maxRepetitions = 0;
    requiredSkills.forEach(reqSkill => {
        if (reqSkill.length > 3) {
            const pattern = new RegExp(`\\b${escapeRegex(reqSkill)}\\b`, 'gi');
            const occurrences = (resumeText.match(pattern) || []).length;
            if (occurrences > maxRepetitions) maxRepetitions = occurrences;
        }
    });
    if (maxRepetitions > 8 || resumeText.length > 12000) {
        roboticFlag = true;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TOTAL + UI BREAKDOWN
    // ═══════════════════════════════════════════════════════════════════════

    const totalScore = skillsRawScore + experienceRawScore + educationRawScore +
                       qualityRawScore + formatRawScore;

    // Normalize each pillar to 0-100 for the UI gauge rings
    const scoreBreakdown = {
        // Raw weighted scores (for internal use)
        skillsRawScore,
        experienceRawScore,
        educationRawScore,
        qualityRawScore,
        formatRawScore,

        // Normalized 0-100 for UI display
        keywords: Math.round(skillRatio * 100),
        skills: Math.round(skillRatio * 100),
        experience: Math.round((experienceRatio) * 100),
        education: Math.round(educationRatio * 100),
        formatting: Math.round(formatRatio * 100),
        quality: Math.round(qualityRatio * 100),

        // Profile completeness (computed, not hardcoded)
        profile: Math.round(formatRatio * 100)
    };

    return {
        totalScore: Math.min(100, Math.max(0, totalScore)),
        scoreBreakdown,
        matchedKeywords,
        missingKeywords,
        roboticFlag
    };
};

module.exports = { calculateDeterministicScore };
