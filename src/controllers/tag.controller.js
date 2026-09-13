import { randomUUID } from 'node:crypto';
import { pool } from '../db/connection.js';
import {
    tagDecorator,
    tagsDecorator,
} from '../decorators/tag.decorator.js';
import { isValidUUID } from '../utils/uuid.util.js';

const createTag = async (req, res) => {
    try {
        const { name, user_id } = req.body;

        if (!name?.trim()) {
            return res.status(400).json({
                message: 'El nombre de la etiqueta es obligatorio.',
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
                INSERT INTO tags (
                    id,
                    name,
                    user_id
                )
                VALUES (?, ?, ?)
            `,
            [id, normalizedName, user_id]
        );

        const tag = tagDecorator({
            id,
            name: normalizedName,
            user_id,
        });

        return res.status(201).json({
            data: tag,
        });
    } catch (error) {
        if (error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                message: 'El usuario indicado no existe.',
            });
        }

        console.error('Error al crear etiqueta:', error.message);

        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};

const getTags = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                message: 'El usuario es obligatorio.',
            });
        }

        const [tags] = await pool.execute(
            `
                SELECT
                    id,
                    name,
                    user_id
                FROM tags
                WHERE user_id = ?
                ORDER BY name ASC
            `,
            [user_id]
        );

        return res.status(200).json({
            data: tagsDecorator(tags),
        });
    } catch (error) {
        console.error('Error al listar etiquetas:', error.message);

        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};

const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, user_id } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message: 'El id de la etiqueta no es válido.',
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                message: 'El nombre de la etiqueta es obligatorio.',
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
                UPDATE tags
                SET name = ?
                WHERE id = ?
                AND user_id = ?
            `,
            [normalizedName, id, user_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Etiqueta no encontrada.',
            });
        }

        const tag = tagDecorator({
            id,
            name: normalizedName,
            user_id,
        });

        return res.status(200).json({
            message: 'Etiqueta actualizada correctamente.',
            data: tag,
        });
    } catch (error) {
        console.error('Error al actualizar etiqueta:', error.message);

        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};

const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.query;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message: 'El id de la etiqueta no es válido.',
            });
        }

        if (!user_id) {
            return res.status(400).json({
                message: 'El usuario es obligatorio.',
            });
        }

        const [tags] = await pool.execute(
            `
                SELECT
                    id,
                    name,
                    user_id
                FROM tags
                WHERE id = ?
                AND user_id = ?
                LIMIT 1
            `,
            [id, user_id]
        );

        if (tags.length === 0) {
            return res.status(404).json({
                message: 'Etiqueta no encontrada.',
            });
        }

        const backup = tagDecorator(tags[0]);

        await pool.execute(
            `
                DELETE FROM tags
                WHERE id = ?
                AND user_id = ?
            `,
            [id, user_id]
        );

        return res.status(200).json({
            data: backup,
        });
    } catch (error) {
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                message:
                    'La etiqueta está asociada a una o más tareas y no puede eliminarse.',
            });
        }

        console.error('Error al eliminar etiqueta:', error.message);

        return res.status(500).json({
            message: 'Error interno del servidor.',
        });
    }
};

export {
    createTag,
    getTags,
    updateTag,
    deleteTag,
};