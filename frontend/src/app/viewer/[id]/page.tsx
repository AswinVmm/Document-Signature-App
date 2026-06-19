"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import API from "@/lib/api";
import DraggableSignature from "@/components/DraggableSignature";
import SignaturePad from "@/components/SignaturePad";

// Disable SSR
const Document = dynamic(
    () => import("react-pdf").then((mod) => mod.Document),
    { ssr: false }
);

const Page = dynamic(
    () => import("react-pdf").then((mod) => mod.Page),
    { ssr: false }
);

type Signature = {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    role: string;
    order: number;   // ✅ NEW
    image: string | null;
};

export default function Viewer() {
    const { id } = useParams();
    const [url, setUrl] = useState("");
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
    const [numPages, setNumPages] = useState(0);
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // prevents accidental clicks
            },
        }),
        useSensor(TouchSensor)
    );

    useEffect(() => {
        // ✅ Import ONLY in browser
        import("react-pdf").then((mod) => {
            mod.pdfjs.GlobalWorkerOptions.workerSrc = new URL(
                "pdfjs-dist/build/pdf.worker.min.mjs",
                import.meta.url
            ).toString();
        });

        API.get(`/api/docs/${id}`).then((res) => {
            setUrl(res.data.url);
        });

    }, [id]);

    return (
        <div className="flex flex-col items-center">
            <SignaturePad onSave={(img: string) => setSignatureImage(img)} />
            <button
                onClick={() => {
                    if (!signatureImage) {
                        alert("Create a signature first!");
                        return;
                    }

                    const newSig: Signature = {
                        id: Date.now().toString(),
                        x: 50,
                        y: 50,
                        width: 120,
                        height: 50,
                        page: currentPage,   // ✅ ALSO FIXED HERE
                        role: "signer",
                        order: signatures.length + 1, // ✅ REQUIRED
                        image: signatureImage,
                    };

                    setSignatures((prev) => [...prev, newSig]);
                }}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                + Add Signature
            </button>
            <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="border px-2 py-1"
            >
                {Array.from({ length: numPages }, (_, i) => (
                    <option key={i} value={i + 1}>
                        Page {i + 1}
                    </option>
                ))}
            </select>
            <div className="flex gap-4 mt-4">
                <button className="bg-green-500 text-white px-4 py-2"
                    onClick={async () => {
                        try {
                            const sorted = [...signatures].sort((a, b) => a.order - b.order);
                            if (!signatureImage) {
                                alert("Please add signature first");
                                return;
                            }

                            try {
                                // ✅ mark as SIGNED
                                await API.post(`/api/docs/${id}/accept`);

                                // 👉 your existing download logic here
                                alert("Document signed & downloaded ✅");
                            } catch (err) {
                                alert("Failed to sign document");
                            }
                            for (let i = 0; i < sorted.length; i++) {
                                if (!sorted[i].image) {
                                    alert(`Signer ${sorted[i].role} must sign first`);
                                    return;
                                }
                            }

                            // for (const sig of signatures) {
                            await API.post(`/api/docs/${id}/sign`, {
                                signatures: signatures.map(sig => ({
                                    x: sig.x / 600,
                                    y: sig.y / 800,
                                    width: sig.width / 600,
                                    height: sig.height / 800,
                                    page: sig.page,
                                    image: sig.image,
                                    role: sig.role,
                                })),
                            });
                            // }
                            // ✅ CALL EXPORT API
                            const response = await API.get(`/api/docs/${id}/export`, {
                                responseType: "blob", // VERY IMPORTANT
                            });

                            // ✅ CREATE DOWNLOAD
                            const blob = new Blob([response.data], { type: "application/pdf" });
                            const url = window.URL.createObjectURL(blob);

                            const link = document.createElement("a");
                            link.href = url;
                            link.setAttribute("download", "signed-document.pdf");
                            document.body.appendChild(link);
                            link.click();

                            link.remove();
                            window.URL.revokeObjectURL(url);

                            alert("Downloaded successfully!");

                        } catch (err) {
                            console.error(err);
                            alert("Error downloading PDF");
                        }
                    }}
                >
                    Save & Download
                </button>
                <button
                    className="bg-red-500 text-white px-4 py-2 mt-2"
                    onClick={async () => {
                        const reason = prompt("Enter rejection reason:");

                        if (!reason) return;

                        try {
                            await API.post(`/api/docs/${id}/reject`, { reason });

                            alert("Document rejected ❌");

                            // optional: redirect back
                            window.location.href = "/documents";
                        } catch (err) {
                            alert("Failed to reject document");
                        }
                    }}
                >
                    Reject
                </button>
            </div>
            <div ref={pdfRef} className="flex flex-col items-center relative">

                {url ? (
                    <DndContext
                        sensors={sensors}
                        onDragEnd={(event) => {
                            const { delta, active } = event;

                            setSignatures((prev) =>
                                prev.map((sig) => {
                                    if (sig.id !== active.id) return sig;

                                    const newY = sig.y + delta.y;
                                    const newPage = Math.floor(newY / 800) + 1;
                                    const localY = ((newY % 800) + 800) % 800;

                                    return {
                                        ...sig,
                                        x: sig.x + delta.x,
                                        y: localY,
                                        page: Math.max(1, newPage),
                                    };
                                })
                            );
                        }}
                    // modifiers={[restrictToParentElement]}
                    >
                        <div className="relative" style={{ width: 600, height: numPages * 800, position: "relative" }}>
                            <div className="mb-4 space-y-2 flex  flex-wrap gap-3 relative z-[100]">
                                {signatures.map((sig) => (
                                    <div key={sig.id} className="flex gap-2 items-center  border px-2 py-1 rounded">

                                        <span className="font-semibold">Sig:</span>

                                        {/* ROLE */}
                                        <select
                                            value={sig.role}
                                            onChange={(e) => {
                                                setSignatures(prev =>
                                                    prev.map(s =>
                                                        s.id === sig.id
                                                            ? { ...s, role: e.target.value }
                                                            : s
                                                    )
                                                );
                                            }}
                                        >
                                            <option value="signer">Signer</option>
                                            <option value="witness">Witness</option>
                                            <option value="approver">Approver</option>
                                        </select>

                                        {/* ORDER */}
                                        <input
                                            type="number"
                                            value={sig.order}
                                            onChange={(e) => {
                                                setSignatures(prev =>
                                                    prev.map(s =>
                                                        s.id === sig.id
                                                            ? { ...s, order: Number(e.target.value) }
                                                            : s
                                                    )
                                                );
                                            }}
                                            className="border w-10 mr-2"
                                        />
                                        {/* ❌ DELETE BUTTON */}
                                        <button
                                            onClick={() => {
                                                setSignatures(prev => prev.filter(s => s.id !== sig.id));
                                            }}
                                            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {/* ✅ PDF (NON-INTERACTIVE ONLY) */}
                            <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                                {Array.from(new Array(numPages), (_, i) => (
                                    <div key={i} className="relative">
                                        <Page
                                            pageNumber={i + 1}
                                            width={600}
                                            renderAnnotationLayer={false}
                                            renderTextLayer={false}
                                            className="pointer-events-none"
                                        />
                                    </div>

                                ))}
                            </Document>
                            <div className="absolute top-0 left-0 w-full h-full z-50">
                                {signatures.map((sig) => (
                                    <DraggableSignature
                                        key={sig.id}
                                        id={sig.id}
                                        image={sig.image}
                                        position={{
                                            x: sig.x,
                                            y: (sig.page - 1) * 800 + sig.y, // 🔥 CRITICAL FIX
                                        }}
                                        size={{ width: sig.width, height: sig.height }}
                                        onResize={(newSize: { width: number; height: number }) => {
                                            setSignatures((prev) =>
                                                prev.map((s) =>
                                                    s.id === sig.id
                                                        ? { ...s, width: newSize.width, height: newSize.height }
                                                        : s
                                                )
                                            );
                                        }}
                                        onSelect={() => setActiveId(sig.id)}
                                        onDelete={(id: string) => {
                                            setSignatures(prev => prev.filter(s => s.id !== id));
                                        }}
                                    />
                                ))}
                            </div>

                        </div>
                    </DndContext>
                ) : (
                    <p>Loading PDF...</p>
                )}
            </div>
        </div>
    );
}