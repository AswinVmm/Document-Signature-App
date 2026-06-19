"use client";

import { useEffect, useState } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AdminDashboard() {
    const [documents, setDocuments] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

    // ✅ Fetch ALL documents (admin gets all)
    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const res = await API.get("/api/docs");
                setDocuments(res.data);
            } catch (err) {
                alert("Failed to fetch documents");
            }
        };

        fetchDocs();
    }, []);

    // ✅ Fetch logs when doc clicked
    const fetchLogs = async (docId: string) => {
        try {
            setSelectedDoc(docId);
            const res = await API.get(`/api/audit/${docId}`);
            setLogs(res.data);
        } catch (err) {
            alert("Only admin can view audit logs");
        }
    };

    return (
        <ProtectedRoute>
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-6">
                    Admin Audit Dashboard 🔐
                </h1>

                <div className="grid grid-cols-2 gap-6">

                    {/* 📄 DOCUMENT LIST */}
                    <div>
                        <h2 className="text-xl font-semibold mb-3">
                            Documents
                        </h2>

                        <div className="border rounded-lg p-2 max-h-[500px] overflow-y-auto">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    onClick={() => fetchLogs(doc.id)}
                                    className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selectedDoc === doc.id
                                        ? "bg-gray-200"
                                        : ""
                                        }`}
                                >
                                    <p className="font-medium">
                                        {doc.original_name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        ID: {doc.id}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 📊 AUDIT LOGS */}
                    <div>
                        <h2 className="text-xl font-semibold mb-3">
                            Audit Logs
                        </h2>

                        <div className="overflow-auto max-h-[500px]">
                            <table className="w-full border">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="p-2">User</th>
                                        <th>Action</th>
                                        <th>IP</th>
                                        <th>Device</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {logs.map((log, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="p-2">
                                                {log.user_id}
                                            </td>
                                            <td>{log.action}</td>
                                            <td>{log.ip}</td>
                                            <td className="text-xs">
                                                {log.user_agent}
                                            </td>
                                            <td>
                                                {new Date(
                                                    log.created_at
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {logs.length === 0 && (
                                <p className="text-gray-500 mt-4 text-center">
                                    Select a document to view logs
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}