import { PDFDocument, rgb } from "pdf-lib";
import fs from "fs";

app.post("/api/docs/:id/export", async (req, res) => {
    const doc = await getDoc(req.params.id); // your DB
    const sig = await getSignature(req.params.id);

    const existingPdfBytes = fs.readFileSync(doc.path);

    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    const page = pdfDoc.getPages()[0];

    const { width, height } = page.getSize();

    // Convert normalized → real position
    const x = sig.x * width;
    const y = height - sig.y * height;

    page.drawText("Signature", {
        x,
        y,
        size: 20,
        color: rgb(0, 0, 0),
    });

    const pdfBytes = await pdfDoc.save();

    fs.writeFileSync(`signed-${doc.name}.pdf`, pdfBytes);

    res.download(`signed-${doc.name}.pdf`);
});