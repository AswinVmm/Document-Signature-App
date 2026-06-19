"use client";

import { createContext, useContext, useState, useEffect } from "react";
import API from "@/lib/api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // check auth via backend
    useEffect(() => {
        API.get("/api/protected")
            .then((res) => {
                setIsLoggedIn(true);
                setRole(res.data.user.role);
            })
            .catch(() => {
                setIsLoggedIn(false);
                setRole(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = (userRole: string) => {
        setIsLoggedIn(true);
        setRole(userRole); // ✅ store role on login
    };

    const logout = async () => {
        await API.post("/api/auth/logout");
        setIsLoggedIn(false);
        setRole(null);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);