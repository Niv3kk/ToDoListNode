import { randomUUID } from 'node:crypto';

import { pool } from '../db/connection.js';

import {
    categoryDecorator,
    categoriesDecorator,
} from '../decorators/category.decorator.js';


const createCategory = async (req, res) => {
    try {
        const {
            name,
            user_id,
        } = req.body;


        if (!name?.trim()) {
            return res.status(400).json({
                message: 'El nombre de la categoría es obligatorio.',
            });
        }


        if (!user_id) {
            return res.status(400).json({
                message: 'El usuario es obligatorio.',
            });
        }


        const normalizedName = name.trim();

        const id = randomUUID();


        await pool.execute(
            `
                INSERT INTO categories (
                    id,
                    name,
                    user_id
                )
                VALUES (?, ?, ?)
            `,
            [
                id,
                normalizedName,
                user_id,
            ]
        );


        const category = categoryDecorator({
            id,
            name: normalizedName,
            user_id,
        });


        return res.status(201).json({
            message: 'Categoría creada correctamente.',
            data: category,
        });

    } catch (error) {

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Ya existe una categoría con ese nombre.',
            });
        }


        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                message: 'El usuario indicado no existe.',
            });
        }


        console.error(
            'Error al crear categoría:',
            error.message
        );


        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};


const getCategories = async (req, res) => {
    try {
        const {
            user_id,
        } = req.query;


        if (!user_id) {
            return res.status(400).json({
                message: 'El usuario es obligatorio.',
            });
        }


        const [categories] = await pool.execute(
            `
                SELECT
                    id,
                    name,
                    user_id
                FROM categories
                WHERE user_id = ?
                ORDER BY name ASC
            `,
            [user_id]
        );


        return res.status(200).json({
            data: categoriesDecorator(categories),
        });

    } catch (error) {

        console.error(
            'Error al listar categorías:',
            error.message
        );


        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};


const updateCategory = async (req, res) => {
    try {
        const {
            id,
        } = req.params;

        const {
            name,
            user_id,
        } = req.body;


        if (!name?.trim()) {
            return res.status(400).json({
                message: 'El nombre de la categoría es obligatorio.',
            });
        }


        if (!user_id) {
            return res.status(400).json({
                message: 'El usuario es obligatorio.',
            });
        }


        const normalizedName = name.trim();


        const [result] = await pool.execute(
            `
                UPDATE categories
                SET name = ?
                WHERE id = ?
                AND user_id = ?
            `,
            [
                normalizedName,
                id,
                user_id,
            ]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Categoría no encontrada.',
            });
        }


        const category = categoryDecorator({
            id,
            name: normalizedName,
            user_id,
        });


        return res.status(200).json({
            message: 'Categoría actualizada correctamente.',
            data: category,
        });

    } catch (error) {

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Ya existe una categoría con ese nombre.',
            });
        }


        console.error(
            'Error al actualizar categoría:',
            error.message
        );


        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};


const deleteCategory = async (req, res) => {
    try {
        const {
            id,
        } = req.params;

        const {
            user_id,
        } = req.query;


        if (!user_id) {
            return res.status(400).json({
                message: 'El usuario es obligatorio.',
            });
        }


        const [result] = await pool.execute(
            `
                DELETE FROM categories
                WHERE id = ?
                AND user_id = ?
            `,
            [
                id,
                user_id,
            ]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Categoría no encontrada.',
            });
        }


        return res.status(200).json({
            message: 'Categoría eliminada correctamente.',
        });

    } catch (error) {

        console.error(
            'Error al eliminar categoría:',
            error.message
        );


        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};


export {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
};