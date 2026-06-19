"use client";

import { useRef, useState } from "react";

export default function SignaturePad({ onSave }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);
    const [mode, setMode] = useState<"draw" | "upload" | "type">("draw");
    const [text, setText] = useState("");

    // ✍️ DRAW MODE
    const start = (e: any) => {
        setDrawing(true);
        draw(e);
    };

    const end = () => setDrawing(false);

    const draw = (e: any) => {
        if (!drawing) return;

        const ctx = canvasRef.current!.getContext("2d")!;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const saveDraw = () => {
        const dataUrl = canvasRef.current!.toDataURL("image/png");
        onSave(dataUrl);
    };

    // 📤 UPLOAD MODE
    const handleUpload = (e: any) => {
        const file = e.target.files?.[0];
        const reader = new FileReader();

        reader.onload = () => {
            onSave(reader.result);
        };

        if (file) reader.readAsDataURL(file);
    };

    // ⌨️ TYPE MODE
    const saveText = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 300;
        canvas.height = 100;

        const ctx = canvas.getContext("2d")!;
        ctx.font = "30px cursive";
        ctx.fillText(text, 10, 50);

        onSave(canvas.toDataURL());
    };

    return (
        <div className="border p-3 rounded mb-3">
            {/* MODE SWITCH */}
            <div className="flex gap-2 mb-2">
                <button onClick={() => setMode("draw")}>Draw</button>
                <button onClick={() => setMode("upload")}>Upload</button>
                <button onClick={() => setMode("type")}>Type</button>
            </div>

            {/* DRAW */}
            {mode === "draw" && (
                <>
                    <canvas
                        ref={canvasRef}
                        width={300}
                        height={150}
                        className="border"
                        onMouseDown={start}
                        onMouseUp={end}
                        onMouseMove={draw}
                    />
                    <button onClick={saveDraw}>Save</button>
                </>
            )}

            {/* UPLOAD */}
            {mode === "upload" && (
                <input type="file" accept="image/*" onChange={handleUpload} />
            )}

            {/* TYPE */}
            {mode === "type" && (
                <div>
                    <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Type signature"
                        className="border px-2"
                    />
                    <button onClick={saveText}>Save</button>
                </div>
            )}
        </div>
    );
}