"use client";

import { useState } from "react";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleUpload = async () => {
        if (!file) return alert("Select a PDF first");

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);

            const res = await API.post("/api/docs/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Uploaded successfully 🎉");
            console.log(res.data);
        } catch (err: any) {
            alert(err.response?.data?.error || "Upload failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <h1 className="text-2xl font-bold">Upload PDF 📄</h1>

                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                        setFile(e.target.files?.[0] || null)
                    }
                />

                <button
                    onClick={handleUpload}
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    {loading ? "Uploading..." : "Upload"}
                </button>
            </div>
        </ProtectedRoute>
    );
}