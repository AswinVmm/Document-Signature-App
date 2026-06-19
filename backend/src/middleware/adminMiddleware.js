import supabase from "../utils/supabaseClient.js";

const adminMiddleware = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
};

export default adminMiddleware;