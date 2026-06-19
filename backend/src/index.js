import "./config/env.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import authMiddleware from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
import docsRoutes from "./routes/docsRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(cookieParser());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/docs", docsRoutes);
app.use("/api/audit", auditRoutes);

// test route
app.get("/", (req, res) => {
    res.send("API is running...");
});

app.get("/api/protected", authMiddleware, (req, res) => {
    res.json({
        message: "Protected data",
        user: req.user,
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});