import multer from "multer";
import crypto from "crypto";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        // Strip any path traversal sequences and grab lowercase extension
        const ext = path.extname(file.originalname).toLowerCase();
        // Generate secure cryptographically random filename
        const uniqueHex = crypto.randomBytes(12).toString("hex");
        const safeName = `${Date.now()}-${uniqueHex}${ext}`;
        cb(null, safeName);
    }
});

const fileFilter = (req, file, cb) => {
    // Only accept incoming image headers at the transport layer
    if (file.mimetype && file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});