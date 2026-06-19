"use client";

import { useAuth } from "@/components/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: any) {
    const { isLoggedIn, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isLoggedIn) {
            router.push("/login");
        }
    }, [loading, isLoggedIn]);

    if (loading) return <div>Loading...</div>; // Show a loading state while checking auth
    if (!isLoggedIn) return null; // prevent flicker

    return children;
}