"use client";

import { useDraggable } from "@dnd-kit/core";

export default function DraggableSignature({ image }: any) {
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
            className="absolute cursor-move"
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