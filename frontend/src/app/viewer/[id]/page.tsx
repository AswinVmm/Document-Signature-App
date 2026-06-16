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
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    page: number;
    role: string;
};

export default function Viewer() {
    const { id } = useParams();
    const [url, setUrl] = useState("");
    const [signatures, setSignatures] = useState<Signature[]>([]);
    const [pdfSize, setPdfSize] = useState({ width: 0, height: 0 });
    const [numPages, setNumPages] = useState(0);
    const [signatureImage, setSignatureImage] = useState<string | null>(null);
    const pdfRef = useRef<HTMLDivElement>(null);
    const [signatureSize, setSignatureSize] = useState({ width: 120, height: 50 });

    // const rect = pdfRef.current?.getBoundingClientRect();
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5, // prevents accidental clicks
            },
        }),
        useSensor(TouchSensor)
    );

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
        <div className="flex flex-col items-center relative">

            {url && (
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
                    <div ref={pdfRef} className="relative">

                        <Document
                            file={url}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        >
                            {Array.from(new Array(numPages), (_, i) => (
                                <Page
                                    key={i}
                                    pageNumber={i + 1}
                                    width={600}
                                    onLoadSuccess={(page) => {
                                        const viewport = page.getViewport({ scale: 1 });
                                        setPdfSize({
                                            width: viewport.width,
                                            height: viewport.height,
                                        });
                                    }}
                                />
                            ))}
                        </Document>
                        <SignaturePad onSave={setSignatureImage} />
                        {signatures.map((sig, index) => (
                            <DraggableSignature
                                key={sig.id}
                                id={sig.id}
                                image={signatureImage}
                                position={{ x: sig.x, y: sig.y }}
                                size={{ width: sig.width, height: sig.height }}
                                onResize={(newSize: { width: number; height: number }) => {
                                    const updated = [...signatures];
                                    updated[index].width = newSize.width;
                                    updated[index].height = newSize.height;
                                    setSignatures(updated);
                                }}
                            />
                        ))}

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
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => {
                                    setSignatures((prev) => [
                                        ...prev,
                                        {
                                            id: Date.now(),
                                            x: 50,
                                            y: 50,
                                            width: 120,
                                            height: 50,
                                            page: 1,
                                            role: "Signer",
                                        },
                                    ]);
                                }}
                                className="bg-black text-white px-4 py-2"
                            >
                                + Add Signature Field
                            </button>

                            <div className="fixed right-0 top-0 h-full w-60 bg-gray-100 p-4 shadow">
                                <h2 className="font-bold mb-2">Recipients</h2>

                                {signatures.map((sig, index) => (
                                    <div key={sig.id} className="mb-3">
                                        <select
                                            value={sig.role}
                                            onChange={(e) => {
                                                const updated = [...signatures];
                                                updated[index].role = e.target.value;
                                                setSignatures(updated);
                                            }}
                                            className="w-full border p-1"
                                        >
                                            <option>Signer</option>
                                            <option>Guarantor</option>
                                            <option>Witness</option>
                                            <option>Approver</option>
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

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

                        <input
                            type="text"
                            placeholder="Type your signature"
                            className="border p-2 mt-2"
                            onChange={(e) => {
                                const text = e.target.value;

                                const canvas = document.createElement("canvas");
                                const ctx = canvas.getContext("2d")!;

                                canvas.width = 300;
                                canvas.height = 100;

                                ctx.font = "30px cursive";
                                ctx.fillText(text, 10, 50);

                                setSignatureImage(canvas.toDataURL());
                            }}
                        />

                        <button
                            onClick={async () => {
                                if (!signatureImage) {
                                    alert("Please create or upload a signature first");
                                    return;
                                }

                                if (!pdfRef.current) {
                                    alert("PDF not ready yet");
                                    return;
                                }

                                if (!pdfSize.width || !pdfSize.height) {
                                    alert("PDF dimensions not available yet");
                                    return;
                                }

                                if (signatures.some((sig) => !isFinite(sig.x) || !isFinite(sig.y))) {
                                    alert("Invalid signature position");
                                    return;
                                }

                                try {
                                    for (const sig of signatures) {
                                        await API.post(`/api/docs/${id}/sign`, {
                                            normalized: {
                                                x: sig.x / pdfSize.width,
                                                y: sig.y / pdfSize.height,
                                            },
                                            width: sig.width / pdfSize.width,
                                            height: sig.height / pdfSize.height,
                                            page: sig.page,
                                            image: signatureImage,
                                            role: sig.role,
                                        });
                                    }

                                    alert("Position saved!");
                                } catch (err: any) {
                                    console.error(err.response?.data || err);
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