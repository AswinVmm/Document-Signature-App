import express from "express";
import { upload } from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { uploadDocument, getDocument, signDocument, listDocuments, deleteDocument } from "../controllers/docsController.js";

const router = express.Router();

router.get("/", authMiddleware, listDocuments);

// PDF upload only
router.post(
    "/upload",
    authMiddleware,
    upload.single("file"),
    uploadDocument
);

router.get("/:id", authMiddleware, getDocument);
router.post("/:id/sign", authMiddleware, signDocument);
router.delete("/:id", authMiddleware, deleteDocument);

export default router;