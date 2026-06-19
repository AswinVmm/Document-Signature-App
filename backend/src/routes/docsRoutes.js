import express from "express";
import { upload } from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadDocument, getDocument, signDocument, listDocuments, deleteDocument, exportSignedPdf, replaceSignatures, acceptDoc, rejectDoc } from "../controllers/docsController.js";
import auditMiddleware from "../middleware/auditMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, listDocuments);

// PDF upload only
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadDocument
);

router.post(
    "/:id/sign",
    authMiddleware,
    auditMiddleware("SIGNED_DOCUMENT"),
    replaceSignatures
);

router.get("/:id", authMiddleware, getDocument);
router.delete("/:id", authMiddleware, deleteDocument);
router.get("/:id/export", authMiddleware, exportSignedPdf);
router.post("/:id/accept", authMiddleware, acceptDoc);
router.post("/:id/reject", authMiddleware, rejectDoc);

export default router;