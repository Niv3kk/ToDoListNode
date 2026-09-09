import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

import { pool } from '../db/connection.js';


const SALT_ROUNDS = 10;


const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
        } = req.body;


        if (!name?.trim()) {
            return res.status(400).json({
                message: 'El nombre es obligatorio.',
            });
        }


        if (!email?.trim()) {
            return res.status(400).json({
                message: 'El correo electrónico es obligatorio.',
            });
        }


        if (!password) {
            return res.status(400).json({
                message: 'La contraseña es obligatoria.',
            });
        }


        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();


        const [existingUsers] = await pool.execute(
            `
                SELECT id
                FROM users
                WHERE email = ?
                LIMIT 1
            `,
            [normalizedEmail]
        );


        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: 'El correo electrónico ya está registrado.',
            });
        }


        const id = randomUUID();

        const hashedPassword = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );


        await pool.execute(
            `
                INSERT INTO users (
                    id,
                    name,
                    email,
                    password
                )
                VALUES (?, ?, ?, ?)
            `,
            [
                id,
                normalizedName,
                normalizedEmail,
                hashedPassword,
            ]
        );


        return res.status(201).json({
            message: 'Usuario creado correctamente.',
            data: {
                id,
                name: normalizedName,
                email: normalizedEmail,
            },
        });

    } catch (error) {

        console.error(
            'Error al crear usuario:',
            error.message
        );


        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};


export {
    createUser,
};