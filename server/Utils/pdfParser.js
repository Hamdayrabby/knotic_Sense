const pdf = require('pdf-parse');

/**
 * Cleans raw text extracted from PDF
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
const cleanText = (text) => {
    if (!text) return '';

    return text
        // Replace excessive newlines and tabs with a single space or explicit newline if needed
        // For resumes, often preserving some structure is good, but for raw keyword matching,
        // we might want a straighter text. Let's do logical normalization.
        .replace(/\r\n|\r/g, '\n') // Normalize newlines
        .replace(/\t/g, ' ') // Tabs to spaces
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable chars (keep ASCII printable + newline)
        .trim();
};

/**
 * Extracts and cleans text from a PDF buffer
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} null if scanned/empty, string if successful
 */
const extractTextFromPDF = async (buffer) => {
    try {
        const data = await pdf(buffer);
        const rawText = data.text;

        if (!rawText || rawText.trim().length === 0) {
            throw new Error('SCANNED_PDF'); // Signal that this is likely a scanned image
        }

        return cleanText(rawText);
    } catch (error) {
        if (error.message === 'SCANNED_PDF') {
            throw error;
        }
        throw new Error('Failed to parse PDF: ' + error.message);
    }
};

module.exports = { extractTextFromPDF };
