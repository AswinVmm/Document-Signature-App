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
                    contentType: "application/pdf",
                    upsert: false,
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
    const { id } = req.params;
    const { normalized, page, image } = req.body;

    const { error } = await supabase
        .from("signatures")
        .upsert([
            {
                document_id: id,
                x: normalized.x,
                y: normalized.y,
                page,
                image,
            },
        ]);

    if (error) { console.log("Supabase error:", error); return res.status(400).json({ error: error.message }) };

    res.json({ message: "Position saved" });
};

export const exportSignedPdf = async (req, res) => {
    const { id } = req.params;

    const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

    const { data: sig } = await supabase
        .from("signatures")
        .select("*")
        .eq("document_id", id)
        .single();

    if (!sig) return res.status(400).json({ error: "No signature found" });

    // get PDF
    const { data: signedUrl } = await supabase.storage
        .from("documents")
        .createSignedUrl(doc.filename, 60);

    const pdfBytes = await fetch(signedUrl.signedUrl).then(res =>
        res.arrayBuffer()
    );

    const pdfDoc = await PDFDocument.load(pdfBytes);

    const pages = pdfDoc.getPages();
    const page = pages[sig.page - 1];

    const { width, height } = page.getSize();

    // ✅ Convert normalized → actual
    const x = sig.x * width;
    const y = height - sig.y * height;

    // ✅ If using image signature
    if (sig.image) {
        const base64 = sig.image.split(",")[1];
        const imageBytes = Buffer.from(base64, "base64");

        const png = await pdfDoc.embedPng(imageBytes);

        page.drawImage(png, {
            x,
            y,
            width: 120,
            height: 50,
        });
    } else {
        page.drawText("Signature", {
            x,
            y,
            size: 20,
        });
    }

    const finalPdf = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=signed.pdf");
    res.send(Buffer.from(finalPdf));
};