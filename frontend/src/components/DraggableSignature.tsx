"use client";

import { useDraggable } from "@dnd-kit/core";

export default function DraggableSignature() {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: "signature",
    });

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