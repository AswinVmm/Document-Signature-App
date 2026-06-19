import supabase from "../utils/supabaseClient.js";

export const getAuditLogs = async (req, res) => {
    const { fileId } = req.params;

    const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("document_id", fileId)
        .order("created_at", { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
};