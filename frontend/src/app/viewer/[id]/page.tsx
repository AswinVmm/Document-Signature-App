"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DndContext } from "@dnd-kit/core";
import API from "@/lib/api";
import DraggableSignature from "@/components/DraggableSignature";

// Disable SSR
const Document = dynamic(
    () => import("react-pdf").then((mod) => mod.Document),
    { ssr: false }
);

const Page = dynamic(
    () => import("react-pdf").then((mod) => mod.Page),
    { ssr: false }
);

export default function Viewer() {
    const { id } = useParams();
    const [url, setUrl] = useState("");
    const [position, setPosition] = useState({ x: 0, y: 0, page: 1 });
    const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
    const [numPages, setNumPages] = useState(0);
    const [signatureImage, setSignatureImage] = useState<string | null>(null);

    const normalized = {
        x: pdfSize.width ? position.x / pdfSize.width : 0,
        y: pdfSize.height ? position.y / pdfSize.height : 0,
    };

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
        <div className="flex flex-col items-center relative">
            {url && (
                <DndContext
                    onDragEnd={(event) => {
                        const { delta } = event;

                        setPosition((prev) => ({
                            ...prev,
                            x: prev.x + delta.x,
                            y: prev.y + delta.y,
                        }));
                    }}
                >
                    <div className="relative">

                        <Document
                            file={url}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        >
                            {Array.from(new Array(numPages), (_, i) => (
                                <Page
                                    key={i}
                                    pageNumber={i + 1}
                                    width={600}
                                />
                            ))}
                        </Document>

                        <DraggableSignature onMove={setPosition} image={signatureImage} />

                        <button
                            onClick={() => {
                                window.open(
                                    `${process.env.NEXT_PUBLIC_BASE_URL}/api/docs/${id}/export`,
                                    "_blank"
                                );
                            }}
                            className="mt-4 bg-blue-500 text-white px-4 py-2"
                        >
                            Download Signed PDF
                        </button>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                const reader = new FileReader();

                                reader.onload = () => {
                                    setSignatureImage(reader.result as string);
                                };

                                if (file) reader.readAsDataURL(file);
                            }}
                        />

                        <button
                            onClick={async () => {
                                try {
                                    await API.post(`/api/docs/${id}/sign`, { normalized, page: position.page, image: signatureImage });
                                    alert("Position saved!");
                                } catch (err) {
                                    console.error(err);
                                    alert("Failed to save");
                                }
                            }}
                            className="mt-4 bg-green-500 text-white px-4 py-2"
                        >
                            Save Signature Position
                        </button>
                    </div>
                </DndContext>
            )}
        </div>
    );
}