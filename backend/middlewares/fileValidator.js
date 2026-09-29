/**
 * File Validation Middleware
 * Validates file type, size, and format for image uploads
 */

export const validateImageFile = (req, res, next) => {
    try {
        // Check if file exists
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please provide an image file."
            });
        }

        // Allowed MIME types
        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

        // Check file size
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(413).json({
                success: false,
                message: `File size exceeds limit. Max: 10MB, Received: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
            });
        }

        // Check MIME type
        if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
            return res.status(415).json({
                success: false,
                message: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
            });
        }

        // Check file extension
        const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.')).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            return res.status(415).json({
                success: false,
                message: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
            });
        }

        // All validations passed
        next();
    } catch (error) {
        console.error("File validation error:", error);
        return res.status(500).json({
            success: false,
            message: "File validation failed"
        });
    }
};

/**
 * Validate multiple file uploads
 */
export const validateImageFiles = (req, res, next) => {
    try {
        // Check if files exist
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No files uploaded. Please provide at least one image file."
            });
        }

        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        const MAX_FILES = 5;

        // Check number of files
        if (req.files.length > MAX_FILES) {
            return res.status(400).json({
                success: false,
                message: `Too many files. Max: ${MAX_FILES}, Received: ${req.files.length}`
            });
        }

        // Validate each file
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

            // Check file size
            if (file.size > MAX_FILE_SIZE) {
                return res.status(413).json({
                    success: false,
                    message: `File ${file.originalname} exceeds size limit (10MB)`
                });
            }

            // Check MIME type
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return res.status(415).json({
                    success: false,
                    message: `File ${file.originalname} has invalid type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
                });
            }

            // Check file extension
            const fileExtension = file.originalname.substring(file.originalname.lastIndexOf('.')).toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
                return res.status(415).json({
                    success: false,
                    message: `File ${file.originalname} has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
                });
            }
        }

        next();
    } catch (error) {
        console.error("Multiple files validation error:", error);
        return res.status(500).json({
            success: false,
            message: "File validation failed"
        });
    }
};
