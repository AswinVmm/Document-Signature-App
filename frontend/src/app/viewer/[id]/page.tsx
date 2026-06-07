"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DndContext } from "@dnd-kit/core";
import API from "@/lib/api";
import DraggableSignature from "@/components/DraggableSignature";

// ✅ Disable SSR
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

    // ✅ FIX: run ONLY in browser
    useEffect(() => {
        const loadPdfWorker = async () => {
            const pdfjs = await import("react-pdf").then((mod) => mod.pdfjs);

            pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js"; // ✅ LOCAL FILE
        };

        loadPdfWorker();
    }, []);

    useEffect(() => {
        API.get(`/api/docs/${id}`).then((res) => {
            setUrl(res.data.url);
        });
    }, [id]);

    return (
        <div className="flex flex-col items-center relative">
            {url && (
                <DndContext>
                    <div className="relative">
                        <Document
                            file={url}
                            onLoadError={(err) => console.log("PDF ERROR:", err)}
                        >
                            <Page pageNumber={1} />
                        </Document>

                        <DraggableSignature />
                    </div>
                </DndContext>
            )}
        </div>
    );
}