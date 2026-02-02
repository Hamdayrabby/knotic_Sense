const pdf = require('pdf-parse');

/**
 * Cleans raw text extracted from PDF
 * @param {string} text - Raw text
 * @returns {string} Cleaned text
 */
const cleanText = (text) => {
    if (!text) return '';

    return text
        .replace(/\r\n|\r/g, '\n') // Normalize newlines
        .replace(/\t/g, ' ') // Tabs to spaces
        .replace(/ +/g, ' ') // Collapse multiple spaces (but NOT newlines)
        .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines to double newline
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
