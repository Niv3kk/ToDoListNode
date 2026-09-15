import { randomUUID } from "node:crypto";

import { pool } from "../db/connection.js";
import {
    tagDecorator,
    tagsDecorator,
} from "../decorators/tag.decorator.js";
import { isValidUUID } from "../utils/uuid.util.js";

const createTag = async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        if (!name?.trim()) {
            return res.status(400).json({
                message:
                    "El nombre de la etiqueta es obligatorio.",
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
            [id, normalizedName, userId]
        );

        const tag = tagDecorator({
            id,
            name: normalizedName,
            user_id: userId,
        });

        return res.status(201).json({
            data: tag,
        });
    } catch (error) {
        console.error(
            "Error al crear etiqueta:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};

const getTags = async (req, res) => {
    try {
        const userId = req.user.id;

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
            [userId]
        );

        return res.status(200).json({
            data: tagsDecorator(tags),
        });
    } catch (error) {
        console.error(
            "Error al listar etiquetas:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};

const updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const userId = req.user.id;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message:
                    "El id de la etiqueta no es válido.",
            });
        }

        if (!name?.trim()) {
            return res.status(400).json({
                message:
                    "El nombre de la etiqueta es obligatorio.",
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
            [normalizedName, id, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Etiqueta no encontrada.",
            });
        }

        const tag = tagDecorator({
            id,
            name: normalizedName,
            user_id: userId,
        });

        return res.status(200).json({
            message:
                "Etiqueta actualizada correctamente.",
            data: tag,
        });
    } catch (error) {
        console.error(
            "Error al actualizar etiqueta:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};

const deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message:
                    "El id de la etiqueta no es válido.",
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
            [id, userId]
        );

        if (tags.length === 0) {
            return res.status(404).json({
                message: "Etiqueta no encontrada.",
            });
        }

        const backup = tagDecorator(tags[0]);

        await pool.execute(
            `
                DELETE FROM tags
                WHERE id = ?
                AND user_id = ?
            `,
            [id, userId]
        );

        return res.status(200).json({
            data: backup,
        });
    } catch (error) {
        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                message:
                    "La etiqueta está asociada a una o más tareas y no puede eliminarse.",
            });
        }

        console.error(
            "Error al eliminar etiqueta:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};

export {
    createTag,
    getTags,
    updateTag,
    deleteTag,
};