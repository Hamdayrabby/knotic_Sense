const { HfInference } = require('@huggingface/inference');

/**
 * Generate a personalized cover letter using Hugging Face LLM
 * @param {Object} resumeStructured - The parsed candidate resume
 * @param {String} jobDescription - The target job description
 * @returns {Promise<String>} - The generated cover letter text
 */
const generateCoverLetter = async (resumeStructured, jobDescription) => {
    if (!process.env.HUGGINGFACE_API_KEY) {
        throw new Error('HUGGINGFACE_API_KEY is not configured');
    }

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
    const model = process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.3-70B-Instruct';

    // Build context strings from resume structured data
    const skills = resumeStructured?.skills?.join(', ') || 'Various skills';
    const experience = resumeStructured?.experience?.map(exp => 
        `- ${exp.title} at ${exp.company}: ${exp.description}`
    ).join('\n') || 'Professional experience';
    
    const candidateName = resumeStructured?.personalInfo?.name || '[Your Name]';
    const contactInfo = resumeStructured?.personalInfo?.email || '[Your Email]';

    const prompt = `
You are an expert career coach and professional copywriter.
Your task is to write a highly tailored, persuasive, and professional cover letter for a candidate applying to a job.

JOB DESCRIPTION:
"""
${jobDescription}
"""

CANDIDATE PROFILE:
Name: ${candidateName}
Contact: ${contactInfo}
Skills: ${skills}
Experience:
${experience}

REQUIREMENTS:
1. The cover letter MUST NOT sound robotic or overly generic. 
2. Match the tone of the job description (e.g., formal for corporate, dynamic for startups).
3. Connect the candidate's specific past experience and skills to the core requirements of the job.
4. Do not invent experience or skills the candidate does not have.
5. Format the output as a clean, ready-to-use letter (you can use placeholders like [Company Name] or [Hiring Manager Name] if they are missing from the JD).
6. Return ONLY the text of the cover letter. Do not wrap it in markdown blocks, JSON, or provide any conversational filler. Just the letter itself.
`;

    try {
        const response = await hf.chatCompletion({
            model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 1000,
            temperature: 0.7,
        });

        const letter = response.choices[0]?.message?.content?.trim();
        if (!letter) throw new Error('Empty response from AI model');

        return letter;
    } catch (error) {
        console.error('Cover letter generation error:', error);
        throw new Error('Failed to generate cover letter');
    }
};

module.exports = { generateCoverLetter };
