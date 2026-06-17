"use client";

import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableSignature({
    id,
    image,
    position,
    size,
    onResize,
    onSelect,
}: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id,
    });

    const style: any = {
        position: "absolute",
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        zIndex: 100,
    };

    const handleResize = (e: any, corner: string) => {
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        const startWidth = size.width;
        const startHeight = size.height;

        const onMove = (moveEvent: any) => {
            let dx = moveEvent.clientX - startX;
            let dy = moveEvent.clientY - startY;

            onResize({
                width: Math.max(50, startWidth + dx),
                height: Math.max(20, startHeight + dy),
            });
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div
                {...listeners}
                {...attributes}
                onMouseDown={onSelect}
                className="w-full h-full cursor-move relative"
            >
                {image ? (
                    <img src={image} className="w-full h-full object-contain pointer-events-none" />
                ) : (
                    <div className="bg-black text-white w-full h-full flex items-center justify-center">
                        Signature ✍️
                    </div>
                )}

                {/* ✅ Resize Handles */}
                {["tl", "tr", "bl", "br"].map((pos) => (
                    <div
                        key={pos}
                        onMouseDown={(e) => handleResize(e, pos)}
                        className="absolute w-3 h-3 bg-blue-500"
                        style={{
                            top: pos.includes("t") ? 0 : "auto",
                            bottom: pos.includes("b") ? 0 : "auto",
                            left: pos.includes("l") ? 0 : "auto",
                            right: pos.includes("r") ? 0 : "auto",
                            cursor: "nwse-resize",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}