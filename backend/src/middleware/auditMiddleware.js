import supabase from "../utils/supabaseClient.js";

const auditMiddleware = (action) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const documentId = req.params.id;

            const ip =
                req.headers["x-forwarded-for"] ||
                req.socket.remoteAddress;

            const userAgent = req.headers["user-agent"];

            if (userId && documentId) {
                await supabase.from("audit_logs").insert([
                    {
                        user_id: userId,
                        document_id: documentId,
                        action,
                        ip,
                        user_agent: userAgent,
                    },
                ]);
            }

            next();
        } catch (err) {
            console.error("Audit log failed:", err.message);
            next(); // don't block request
        }
    };
};

export default auditMiddleware;