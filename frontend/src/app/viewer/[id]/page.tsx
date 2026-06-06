"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Document, Page } from "react-pdf";
import { DndContext } from "@dnd-kit/core";
import API from "@/lib/api";
import DraggableSignature from "@/components/DraggableSignature";

export default function Viewer() {
    const { id } = useParams();
    const [url, setUrl] = useState("");

    useEffect(() => {
        API.get(`/api/docs/${id}`).then(res => {
            setUrl(res.data.url);
        });
    }, [id]);

    const handleSign = async () => {
        await API.post(`/api/docs/${id}/sign`, {
            x: 100,
            y: 100,
        });

        alert("Signed!");
    };

    return (
        <div className="flex flex-col items-center relative">
            {url && (
                <DndContext>
                    <div className="relative">
                        <Document file={url}>
                            <Page pageNumber={1} />
                        </Document>

                        {/* 🔥 Signature overlay */}
                        <DraggableSignature />
                    </div>
                </DndContext>
            )}
            <button onClick={handleSign} className="mt-4 bg-green-500 text-white px-4 py-2">
                Sign Document
            </button>
        </div>
    );
}