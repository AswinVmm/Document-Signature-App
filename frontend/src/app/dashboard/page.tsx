"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
        API.get("/protected")
            .then((res) => console.log(res.data))
            .catch(() => console.log("Unauthorized"));
    }, []);

    return (
        <ProtectedRoute>
            <div className="flex h-screen items-center justify-center">
                <h1 className="text-3xl">Welcome to Dashboard 🚀</h1>
            </div>
        </ProtectedRoute>
    );
}