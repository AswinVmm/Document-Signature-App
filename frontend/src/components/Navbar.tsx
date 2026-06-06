"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth";

export default function Navbar() {
    const { isLoggedIn, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = "/login"; // redirect after logout
    };

    return (
        <nav className="flex justify-between items-center px-6 py-4 shadow-md">
            {/* Logo */}
            <h1 className="text-xl font-bold">
                DocSign ✍️
            </h1>

            {/* Links */}
            <div className="flex gap-6 items-center">
                <Link href="/" className="hover:text-blue-500">
                    Home
                </Link>

                {isLoggedIn && (
                    <Link href="/upload" className="hover:text-blue-500">
                        Upload
                    </Link>
                )}
                {isLoggedIn && (
                    <Link href="/documents" className="hover:text-blue-500">
                        Documents
                    </Link>
                )}

                {!isLoggedIn ? (
                    <>
                        <Link href="/register" className=" hover:bg-green-600 bg-green-500 hover:text-white px-3 py-1 rounded">
                            Login/Register
                        </Link>
                    </>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                        Logout
                    </button>
                )}

            </div>
        </nav>
    );
}