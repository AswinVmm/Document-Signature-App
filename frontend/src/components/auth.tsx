"use client";

import { createContext, useContext, useState, useEffect } from "react";
import API from "@/lib/api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 🔥 check auth via backend
    useEffect(() => {
        API.get("/api/protected")
            .then(() => setIsLoggedIn(true))
            .catch(() => setIsLoggedIn(false));
    }, []);

    const login = () => setIsLoggedIn(true);

    const logout = async () => {
        await API.post("/api/auth/logout");
        setIsLoggedIn(false);
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);