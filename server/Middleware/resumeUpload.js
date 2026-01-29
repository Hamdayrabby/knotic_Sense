const multer = require('multer');

// Configure storage strategy (Memory Storage)
const storage = multer.memoryStorage();

// File filter for PDF only
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        // Reject file
        const error = new Error('Invalid file type. Only PDF files are allowed.');
        error.code = 'LIMIT_FILE_TYPES';
        cb(error, false);
    }
};

// Configure upload limits
const limits = {
    fileSize: 2 * 1024 * 1024 // 2MB limit
};

// Initialize multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: limits
});

module.exports = upload;
