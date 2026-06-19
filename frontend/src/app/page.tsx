"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

type Doc = {
    id: string;
    original_name: string;
    status: "pending" | "signed" | "rejected";
};

export default function Home() {
    const [docs, setDocs] = useState<Doc[]>([]);
    const [filter, setFilter] = useState<"all" | "pending" | "signed" | "rejected">("all");

    useEffect(() => {
        API.get("/api/docs")
            .then(res => setDocs(res.data))
            .catch(console.error);
    }, []);

    const filteredDocs =
        filter === "all"
            ? docs
            : docs.filter((d) => d.status === filter);

    const stats = {
        total: docs.length,
        pending: docs.filter(d => d.status === "pending").length,
        signed: docs.filter(d => d.status === "signed").length,
        rejected: docs.filter(d => d.status === "rejected").length,
    };

    return (
        <ProtectedRoute>
            <div className="p-6 max-w-6xl mx-auto">

                {/* 🔥 HEADER */}
                <h1 className="text-3xl font-bold mb-6">
                    Dashboard
                </h1>

                {/* 📊 STATS */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <StatCard title="Total" value={stats.total} />
                    <StatCard title="Pending" value={stats.pending} color="yellow" />
                    <StatCard title="Signed" value={stats.signed} color="green" />
                    <StatCard title="Rejected" value={stats.rejected} color="red" />
                </div>

                {/* 🔎 FILTERS */}
                <div className="flex gap-3 mb-6">
                    {["all", "pending", "signed", "rejected"].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded border 
                                ${filter === f ? "bg-black text-white" : "bg-white"}
                            `}
                        >
                            {f.toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* 📄 DOCUMENT LIST */}
                <div className="bg-white shadow rounded-lg">
                    {filteredDocs.length === 0 ? (
                        <p className="p-4 text-gray-500">No documents found</p>
                    ) : (
                        filteredDocs.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex justify-between items-center p-4 border-b hover:bg-gray-50"
                            >
                                <span className="font-medium">
                                    {doc.original_name}
                                </span>

                                <span
                                    className={`px-3 py-1 rounded text-sm font-medium
                                        ${doc.status === "pending" && "bg-yellow-100 text-yellow-700"}
                                        ${doc.status === "signed" && "bg-green-100 text-green-700"}
                                        ${doc.status === "rejected" && "bg-red-100 text-red-700"}
                                    `}
                                >
                                    {doc.status.toUpperCase()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}

/* ✅ Reusable Stat Card */
function StatCard({ title, value, color = "gray" }: any) {
    const colors: any = {
        gray: "bg-gray-100 text-gray-800",
        yellow: "bg-yellow-100 text-yellow-800",
        green: "bg-green-100 text-green-800",
        red: "bg-red-100 text-red-800",
    };

    return (
        <div className={`p-4 rounded-lg shadow ${colors[color]}`}>
            <p className="text-sm">{title}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
        </div>
    );
}