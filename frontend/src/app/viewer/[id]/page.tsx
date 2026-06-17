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

    // const rect = pdfRef.current?.getBoundingClientRect();
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // prevents accidental clicks
            },
        }),
        useSensor(TouchSensor)
    );

    const sorted = [...signatures].sort((a, b) => a.order - b.order);

    for (let i = 0; i < sorted.length; i++) {
        if (!sorted[i].image) {
            alert(`Signer ${sorted[i].role} must sign first`);
            return;
        }
    }

    // normalized position/size relative to the PDF dimensions
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
            <button
                onClick={async () => {
                    const sorted = [...signatures].sort((a, b) => a.order - b.order);

                    for (let i = 0; i < sorted.length; i++) {
                        if (!sorted[i].image) {
                            alert(`Signer ${sorted[i].role} must sign first`);
                            return;
                        }
                    }

                    for (const sig of signatures) {
                        await API.post(`/api/docs/${id}/sign`, {
                            normalized: {
                                x: sig.x / 600,
                                y: sig.y / 800,
                            },
                            width: sig.width / 600,
                            height: sig.height / 800,
                            page: sig.page,
                            image: sig.image,
                            role: sig.role,
                        });
                    }

                    alert("Saved!");
                }}
            >
                Save
            </button>
            <div ref={pdfRef} className="flex flex-col items-center relative">

                {url ? (
                    <DndContext
                        sensors={sensors}
                        onDragEnd={(event) => {
                            const { delta, active } = event;

                            setSignatures((prev) =>
                                prev.map((sig) =>
                                    sig.id === active.id
                                        ? {
                                            ...sig,
                                            x: sig.x + delta.x,
                                            y: sig.y + delta.y,
                                        }
                                        : sig
                                )
                            );
                        }}
                        modifiers={[restrictToParentElement]}
                    >
                        <div className="relative inline-block">

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

                                        {/* ✅ SIGNATURES ONLY FOR THIS PAGE */}
                                        <div className="absolute top-0 left-0 w-full h-full">
                                            {signatures
                                                .filter(sig => sig.page === i + 1)
                                                .map((sig, index) => (
                                                    <div key={sig.id} className="flex gap-2 items-center mt-2">
                                                        <select
                                                            value={sig.role}
                                                            onChange={(e) => {
                                                                const updated = [...signatures];
                                                                updated[index].role = e.target.value;
                                                                setSignatures(updated);
                                                            }}
                                                        >
                                                            <option>Signer</option>
                                                            <option>Witness</option>
                                                            <option>Approver</option>
                                                        </select>

                                                        <input
                                                            type="number"
                                                            value={sig.order}
                                                            onChange={(e) => {
                                                                const updated = [...signatures];
                                                                updated[index].order = Number(e.target.value);
                                                                setSignatures(updated);
                                                            }}
                                                            className="border w-16"
                                                        />

                                                        <DraggableSignature
                                                            key={sig.id}
                                                            id={sig.id}
                                                            image={sig.image}
                                                            position={{ x: sig.x, y: sig.y }}
                                                            size={{ width: sig.width, height: sig.height }}
                                                            onResize={(newSize: { width: number; height: number }) => {
                                                                const updated = [...signatures];
                                                                updated[index].width = newSize.width;
                                                                updated[index].height = newSize.height;
                                                                setSignatures(updated);
                                                            }}
                                                            onSelect={() => setActiveId(sig.id)}
                                                        />
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </Document>

                            {/* ✅ DRAG LAYER (interactive) */}
                            {/* <div className="absolute top-0 left-0 w-full h-full z-50">
                                {signatures.map((sig, index) => (
                                    <DraggableSignature
                                        key={sig.id}
                                        id={sig.id}
                                        image={sig.image}
                                        position={{ x: sig.x, y: sig.y }}
                                        size={{ width: sig.width, height: sig.height }}
                                        onResize={(newSize: { width: number; height: number }) => {
                                            const updated = [...signatures];
                                            updated[index].width = newSize.width;
                                            updated[index].height = newSize.height;
                                            setSignatures(updated);
                                        }}
                                        onSelect={() => setActiveId(sig.id)}
                                    />
                                ))}
                            </div> */}

                        </div>
                    </DndContext>
                ) : (
                    <p>Loading PDF...</p>
                )}
            </div>
        </div>
    );
}