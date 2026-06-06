import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../utils/supabaseClient.js";

const JWT_SECRET = process.env.JWT_SECRET;

// 🔐 REGISTER
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // insert user
        const { data, error } = await supabase
            .from("users")
            .insert([{ name, email, password: hashedPassword }])
            .select();

        if (error) return res.status(400).json({ error: error.message || "Registration failed" });

        res.status(201).json({ message: "User registered", user: data[0] });
    } catch (err) {
        res.status(500).json({ error: err.message || "Internal server error" });
    }
};

// 🔑 LOGIN
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // find user
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (error || !data) {
            return res.status(400).json({ error: error.message || "User not found" });
        }

        // compare password
        const isMatch = await bcrypt.compare(password, data.password);

        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // create token
        const token = jwt.sign(
            { id: data.id, email: data.email },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // true in production (HTTPS)
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.json({ message: "Login successful" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const logout = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
};