import supabase from "../utils/supabaseClient.js";
import { v4 as uuidv4 } from "uuid";
import { PDFDocument } from "pdf-lib";

export const uploadDocument = async (req, res) => {
    try {
        const file = req.file;
        const userId = req.user.id;

        if (!file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        const fileName = `${userId}/${uuidv4()}.pdf`;

        // upload to Supabase Storage
        const { data: storageData, error: storageError } =
            await supabase.storage
                .from("documents")
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                });

        if (storageError) {
            return res.status(400).json({ error: storageError.message });
        }

        // save metadata
        const { data, error } = await supabase
            .from("documents")
            .insert([
                {
                    user_id: userId,
                    filename: fileName,
                    original_name: file.originalname,
                    size: file.size,
                },
            ])
            .select();

        if (error) return res.status(400).json({ error: error.message });

        res.json({ message: "Uploaded", file: data[0] });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getDocument = async (req, res) => {
    const { id } = req.params;

    const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

    if (!doc) return res.status(404).json({ error: "Not found" });

    const { data, error } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.filename, 60 * 5); // 5 mins

    if (error) return res.status(400).json({ error: error.message });

    res.json({ url: data.signedUrl });
};

export const listDocuments = async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId);

    if (error) return res.status(400).json({ error: error.message });

    res.json(data);
};

export const deleteDocument = async (req, res) => {
    const { id } = req.params;

    const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

    if (!doc) return res.status(404).json({ error: "Not found" });

    // delete from storage
    await supabase.storage
        .from("documents")
        .remove([doc.filename]);

    // delete from DB
    await supabase
        .from("documents")
        .delete()
        .eq("id", id);

    res.json({ message: "Deleted" });
};

export const signDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { x, y } = req.body;

        // 1. get document
        const { data: doc } = await supabase
            .from("documents")
            .select("*")
            .eq("id", id)
            .single();

        if (!doc) return res.status(404).json({ error: "Not found" });

        // 2. get signed URL (read file)
        const { data: signed } = await supabase.storage
            .from("documents")
            .createSignedUrl(doc.filename, 60);

        const existingPdfBytes = await fetch(signed.signedUrl)
            .then(res => res.arrayBuffer());

        // 3. modify PDF
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        const page = pdfDoc.getPages()[0];

        page.drawText("Signed", {
            x,
            y,
            size: 20,
        });

        const pdfBytes = await pdfDoc.save();

        // 4. upload new signed file
        const newFileName = `signed-${doc.filename}`;

        await supabase.storage
            .from("documents")
            .upload(newFileName, pdfBytes, {
                contentType: "application/pdf",
                upsert: true,
            });

        res.json({ message: "Document signed", file: newFileName });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};