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
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
    const normalized = {
        x: position.x / pdfSize.width,
        y: position.y / pdfSize.height,
    };

    useEffect(() => {
        const signDocument = async () => {
            await API.post(`/api/docs/${id}/sign`, {
                x: normalized.x,
                y: normalized.y,
            });
        };

        signDocument();
    }, [id, normalized]);

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
                <DndContext>
                    <div className="relative">
                        <Document file={url}>
                            <Page
                                pageNumber={1}
                                onLoadSuccess={(page) => {
                                    setPdfSize({
                                        width: page.width,
                                        height: page.height,
                                    });
                                }}
                            />
                        </Document>

                        <DraggableSignature onMove={setPosition} />
                        <button
                            onClick={() => {
                                window.open(`/api/docs/${id}/export`);
                            }}
                            className="mt-4 bg-blue-500 text-white px-4 py-2"
                        >
                            Download Signed PDF
                        </button>
                    </div>
                </DndContext>
            )}
        </div>
    );
}