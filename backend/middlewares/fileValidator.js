import fs from "fs";

/**
 * Verifies true binary signature (magic bytes) of an image file.
 * Prevents disguised code files (PHP, JS, Shell, Python, HTML, EXE)
 * from being accepted even if they have a .jpg or .png extension.
 */
export function isValidImageMagicBytes(filePath) {
    if (!filePath || !fs.existsSync(filePath)) {
        return false;
    }

    try {
        const buffer = Buffer.alloc(12);
        const fd = fs.openSync(filePath, "r");
        const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
        fs.closeSync(fd);

        if (bytesRead < 4) {
            return false;
        }

        // JPEG / JPG signature: FF D8 FF
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            return true;
        }

        // PNG signature: 89 50 4E 47 0D 0A 1A 0A
        if (
            bytesRead >= 8 &&
            buffer[0] === 0x89 &&
            buffer[1] === 0x50 &&
            buffer[2] === 0x4E &&
            buffer[3] === 0x47 &&
            buffer[4] === 0x0D &&
            buffer[5] === 0x0A &&
            buffer[6] === 0x1A &&
            buffer[7] === 0x0A
        ) {
            return true;
        }

        // WEBP signature: RIFF .... WEBP
        if (
            bytesRead >= 12 &&
            buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
            buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
        ) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("Binary magic bytes check error:", error);
        return false;
    }
}

/**
 * Single Image File Validation Middleware
 * Checks: File presence, Max Size (10MB), Client MIME type, File extension, and True Magic Bytes.
 */
export const validateImageFile = (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded. Please provide an image file."
            });
        }

        const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

        // 1. Check file size
        if (req.file.size > MAX_FILE_SIZE) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(413).json({
                success: false,
                message: `File size exceeds limit. Max: 10MB, Received: ${(req.file.size / 1024 / 1024).toFixed(2)}MB`
            });
        }

        // 2. Check Client MIME type
        if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(415).json({
                success: false,
                message: `Invalid MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
            });
        }

        // 3. Check File Extension
        const originalName = req.file.originalname || "";
        const dotIndex = originalName.lastIndexOf('.');
        if (dotIndex === -1) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(415).json({
                success: false,
                message: "File missing extension. Allowed: .jpg, .jpeg, .png, .webp"
            });
        }

        const fileExtension = originalName.substring(dotIndex).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(415).json({
                success: false,
                message: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
            });
        }

        // 4. Binary Magic Number Inspection (Deep Content Verification)
        const isGenuineImage = isValidImageMagicBytes(req.file.path);
        if (!isGenuineImage) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(415).json({
                success: false,
                message: "Security violation: File header does not match a valid image format. Executable/script contents are strictly prohibited."
            });
        }

        // All validations passed
        next();
    } catch (error) {
        console.error("File validation error:", error);
        if (req.file?.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (_) {}
        }
        return res.status(500).json({
            success: false,
            message: "File validation failed"
        });
    }
};

/**
 * Validate Multiple File Uploads
 */
export const validateImageFiles = (req, res, next) => {
    try {
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

        if (req.files.length > MAX_FILES) {
            // Cleanup all files
            req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
            return res.status(400).json({
                success: false,
                message: `Too many files. Max: ${MAX_FILES}, Received: ${req.files.length}`
            });
        }

        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];

            if (file.size > MAX_FILE_SIZE) {
                req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                return res.status(413).json({
                    success: false,
                    message: `File ${file.originalname} exceeds size limit (10MB)`
                });
            }

            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                return res.status(415).json({
                    success: false,
                    message: `File ${file.originalname} has invalid type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
                });
            }

            const dotIndex = file.originalname.lastIndexOf('.');
            const fileExtension = dotIndex !== -1 ? file.originalname.substring(dotIndex).toLowerCase() : "";
            if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
                req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                return res.status(415).json({
                    success: false,
                    message: `File ${file.originalname} has invalid extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
                });
            }

            // Deep content magic bytes verification
            if (!isValidImageMagicBytes(file.path)) {
                req.files.forEach(f => { if (fs.existsSync(f.path)) fs.unlinkSync(f.path); });
                return res.status(415).json({
                    success: false,
                    message: `Security violation: File ${file.originalname} is not a valid image format.`
                });
            }
        }

        next();
    } catch (error) {
        console.error("Multiple files validation error:", error);
        if (req.files) {
            req.files.forEach(f => { if (f?.path && fs.existsSync(f.path)) fs.unlinkSync(f.path); });
        }
        return res.status(500).json({
            success: false,
            message: "File validation failed"
        });
    }
};

/**
 * Optional image validation middleware (e.g. for registration where avatar is optional)
 */
export const optionalValidateImageFile = (req, res, next) => {
    if (!req.file) {
        return next();
    }
    return validateImageFile(req, res, next);
};

