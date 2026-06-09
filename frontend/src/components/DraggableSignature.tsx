"use client";

import { useDraggable } from "@dnd-kit/core";
import { useEffect } from "react";

export default function DraggableSignature({ onMove }: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "signature",
    });

    useEffect(() => {
        if (transform) {
            onMove({
                x: transform.x,
                y: transform.y,
            });
        }
    }, [transform, onMove]);

    const style = {
        transform: transform
            ? `translate(${transform.x}px, ${transform.y}px)`
            : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="absolute bg-black text-white px-2 py-1 cursor-move"
        >
            Signature ✍️
        </div>
    );
}