"use client";

import { useRef, useState } from "react";

export default function SignaturePad({ onSave }: any) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [drawing, setDrawing] = useState(false);

    const start = (e: any) => {
        setDrawing(true);
        draw(e);
    };

    const end = () => {
        setDrawing(false);
    };

    const draw = (e: any) => {
        if (!drawing) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;

        ctx.lineWidth = 2;
        ctx.lineCap = "round";

        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const save = () => {
        const dataUrl = canvasRef.current!.toDataURL("image/png");
        onSave(dataUrl);
    };

    return (
        <div>
            <canvas
                ref={canvasRef}
                width={300}
                height={150}
                className="border"
                onMouseDown={start}
                onMouseUp={end}
                onMouseMove={draw}
            />
            <button onClick={save}>Save Signature</button>
        </div>
    );
}