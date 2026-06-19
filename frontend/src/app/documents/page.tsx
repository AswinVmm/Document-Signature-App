"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DocumentsPage() {

    type Doc = {
        id: string;
        original_name: string;
        status: "pending" | "signed" | "rejected";
        rejection_reason?: string;
    };

    const [docs, setDocs] = useState<Doc[]>([]);

    useEffect(() => {
        API.get("/api/docs")
            .then(res => setDocs(res.data))
            .catch(console.error);
    }, []);

    const handleDelete = async (id: string) => {
        await API.delete(`/api/docs/${id}`);
        setDocs(docs.filter((d: any) => d.id !== id));
    };

    const handleAccept = async (id: string) => {
        try {
            await API.post(`/api/docs/${id}/accept`);
            setDocs(prev =>
                prev.map((d: any) =>
                    d.id === id ? { ...d, status: "signed" } : d
                )
            );
        } catch (err) {
            alert("Failed to accept document");
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Enter rejection reason:");

        if (!reason) return;

        try {
            await API.post(`/api/docs/${id}/reject`, { reason });

            setDocs(prev =>
                prev.map((d: any) =>
                    d.id === id
                        ? { ...d, status: "rejected", rejection_reason: reason }
                        : d
                )
            );
        } catch (err) {
            alert("Failed to reject document");
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6">
                <h1 className="text-2xl mb-4">My Documents</h1>

                {docs.map((doc: any) => (
                    <div key={doc.id} className="flex justify-between items-center border p-3 mb-2">
                        <div className="flex flex-col">
                            <span className="font-medium">{doc.original_name}</span>

                            {/* ✅ STATUS BADGE */}
                            <span
                                className={`text-sm mt-1 px-2 py-1 w-fit rounded
                    ${doc.status === "pending" && "bg-yellow-200 text-yellow-800"}
                    ${doc.status === "signed" && "bg-green-200 text-green-800"}
                    ${doc.status === "rejected" && "bg-red-200 text-red-800"}
                `}
                            >
                                Status: {doc.status?.toUpperCase() || "UNKNOWN"}
                            </span>

                            {/* ❌ Show rejection reason */}
                            {doc.status === "rejected" && doc.rejection_reason && (
                                <span className="text-xs text-red-600 mt-1">
                                    Reason: {doc.rejection_reason}
                                </span>
                            )}
                        </div>

                        <div className="flex gap-3 items-center">

                            <button onClick={() => window.location.href = `/viewer/${doc.id}`}>
                                View
                            </button>

                            {/* ✅ SIGN ACTIONS (only if pending) */}
                            {doc.status === "pending" && (
                                <>
                                    <button
                                        onClick={() => handleAccept(doc.id)}
                                        className="bg-green-500 text-white px-2 py-1 rounded"
                                    >
                                        Accept
                                    </button>

                                    <button
                                        onClick={() => handleReject(doc.id)}
                                        className="bg-red-500 text-white px-2 py-1 rounded"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}

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