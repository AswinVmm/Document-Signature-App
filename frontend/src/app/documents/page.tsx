"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DocumentsPage() {
    const [docs, setDocs] = useState([]);

    useEffect(() => {
        API.get("/api/docs")
            .then(res => setDocs(res.data))
            .catch(console.error);
    }, []);

    const handleDelete = async (id: string) => {
        await API.delete(`/api/docs/${id}`);
        setDocs(docs.filter((d: any) => d.id !== id));
    };

    return (
        <ProtectedRoute>
            <div className="p-6">
                <h1 className="text-2xl mb-4">My Documents</h1>

                {docs.map((doc: any) => (
                    <div key={doc.id} className="flex justify-between border p-3 mb-2">
                        <span>{doc.original_name}</span>

                        <div className="flex gap-3">
                            <button onClick={() => window.location.href = `/viewer/${doc.id}`}>
                                View
                            </button>

                            <button onClick={() => handleDelete(doc.id)}>
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ProtectedRoute>
    );
}