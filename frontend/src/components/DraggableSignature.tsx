"use client";

import type { CSSProperties } from "react";
import { useDraggable } from "@dnd-kit/core";

export default function DraggableSignature({ image, position }: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "signature",
    });

    const style: CSSProperties = {
        position: "absolute",
        left: position.x,
        top: position.y,
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
            className="cursor-move"
        >
            {image ? (
                <img src={image} className="w-32" />
            ) : (
                <div className="bg-black text-white px-2 py-1">
                    Signature ✍️
                </div>
            )}
        </div>
    );
}