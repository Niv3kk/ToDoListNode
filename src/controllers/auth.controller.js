import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { pool } from "../db/connection.js";

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email?.trim() || !password) {
            return res.status(400).json({
                message:
                    "El correo electrónico y la contraseña son obligatorios.",
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const [users] = await pool.execute(
            `
                SELECT
                    id,
                    name,
                    email,
                    password
                FROM users
                WHERE email = ?
                LIMIT 1
            `,
            [normalizedEmail]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Credenciales inválidas.",
            });
        }

        const user = users[0];

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Credenciales inválidas.",
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn:
                    process.env.JWT_EXPIRES_IN || "1h",
            }
        );

        return res.status(200).json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(
            "Error al iniciar sesión:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};

export {
    login,
};