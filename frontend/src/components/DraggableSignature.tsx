"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableSignature({
    image,
    position,
    size,
    onResize,
}: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "signature",
    });

    const [resizing, setResizing] = useState(false);

    const handleResize = (e: any) => {
        e.stopPropagation();
        setResizing(true);

        const startX = e.clientX;
        const startY = e.clientY;

        const startWidth = size.width;
        const startHeight = size.height;

        const onMove = (moveEvent: any) => {
            const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
            const newHeight = Math.max(20, startHeight + (moveEvent.clientY - startY));

            onResize({
                width: newWidth,
                height: newHeight,
            });
        };

        const onUp = () => {
            setResizing(false);
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const style: any = {
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        zIndex: 50,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="cursor-move relative"
        >
            {image ? (
                <img src={image} className="w-full h-full object-contain" />
            ) : (
                <div className="bg-black text-white w-full h-full flex items-center justify-center">
                    Signature ✍️
                </div>
            )}

            {/* Resize Handle */}
            <div
                onMouseDown={handleResize}
                className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
            />
        </div>
    );
}