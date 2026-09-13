import { randomUUID } from "node:crypto";

import { pool } from "../db/connection.js";
import {
    taskDecorator,
    tasksDecorator,
} from "../decorators/task.decorator.js";
import { isValidUUID } from "../utils/uuid.util.js";
import {
    statusTasks,
    isValidTaskStatus,
} from "../utils/statusTasks.js";


const store = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const {
            title,
            description = null,
            is_completed = statusTasks.PENDING,
            category_id,
            user_id,
            tags = [],
        } = req.body;

        if (!title?.trim() || !category_id || !user_id) {
            return res.status(400).json({
                message:
                    "El título, la categoría y el usuario son obligatorios.",
            });
        }

        if (!isValidTaskStatus(is_completed)) {
            return res.status(400).json({
                message: "El estado de la tarea no es válido.",
            });
        }

        if (!Array.isArray(tags)) {
            return res.status(400).json({
                message:
                    "Las etiquetas deben enviarse como un arreglo.",
            });
        }

        if (
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message:
                    "La descripción debe ser una cadena de texto.",
            });
        }

        const normalizedTitle = title.trim();
        const normalizedDescription =
            description?.trim() || null;

        const uniqueTags = [...new Set(tags)];

        connection = await pool.getConnection();

        const [categories] = await connection.execute(
            `
                SELECT
                    id,
                    name
                FROM categories
                WHERE id = ?
                AND user_id = ?
                LIMIT 1
            `,
            [category_id, user_id]
        );

        if (categories.length === 0) {
            return res.status(400).json({
                message:
                    "La categoría no existe o no pertenece al usuario.",
            });
        }

        let existingTags = [];

        if (uniqueTags.length > 0) {
            const placeholders = uniqueTags
                .map(() => "?")
                .join(",");

            [existingTags] = await connection.execute(
                `
                    SELECT
                        id,
                        name
                    FROM tags
                    WHERE user_id = ?
                    AND id IN (${placeholders})
                `,
                [user_id, ...uniqueTags]
            );

            if (existingTags.length !== uniqueTags.length) {
                return res.status(400).json({
                    message:
                        "Una o más etiquetas no existen o no pertenecen al usuario.",
                });
            }
        }

        await connection.beginTransaction();
        transactionStarted = true;

        const id = randomUUID();

        await connection.execute(
            `
                INSERT INTO tasks (
                    id,
                    title,
                    description,
                    is_completed,
                    category_id,
                    user_id
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                id,
                normalizedTitle,
                normalizedDescription,
                is_completed,
                category_id,
                user_id,
            ]
        );

        for (const tagId of uniqueTags) {
            await connection.execute(
                `
                    INSERT INTO tags_task (
                        tag_id,
                        task_id
                    )
                    VALUES (?, ?)
                `,
                [tagId, id]
            );
        }

        await connection.commit();
        transactionStarted = false;

        const task = taskDecorator({
            id,
            title: normalizedTitle,
            description: normalizedDescription,
            is_completed,
            category_id,
            category_name: categories[0].name,
            user_id,
            tags: existingTags,
        });

        return res.status(201).json({
            data: task,
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error(
            "Error al crear tarea:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    } finally {
        connection?.release();
    }
};


const index = async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({
                message: "El usuario es obligatorio.",
            });
        }

        const [tasks] = await pool.execute(
            `
                SELECT
                    id,
                    title,
                    description,
                    is_completed,
                    category_id,
                    user_id
                FROM tasks
                WHERE user_id = ?
                ORDER BY title ASC
            `,
            [user_id]
        );

        if (tasks.length === 0) {
            return res.status(200).json({
                data: [],
            });
        }

        const categoryIds = [
            ...new Set(
                tasks.map((task) => task.category_id)
            ),
        ];

        const categoryPlaceholders = categoryIds
            .map(() => "?")
            .join(",");

        const [categories] = await pool.execute(
            `
                SELECT
                    id,
                    name
                FROM categories
                WHERE user_id = ?
                AND id IN (${categoryPlaceholders})
            `,
            [user_id, ...categoryIds]
        );

        const taskIds = tasks.map((task) => task.id);

        const taskPlaceholders = taskIds
            .map(() => "?")
            .join(",");

        const [tags] = await pool.execute(
            `
                SELECT
                    tags_task.task_id,
                    tags.id,
                    tags.name
                FROM tags_task
                INNER JOIN tags
                    ON tags.id = tags_task.tag_id
                WHERE tags.user_id = ?
                AND tags_task.task_id IN (${taskPlaceholders})
            `,
            [user_id, ...taskIds]
        );

        return res.status(200).json({
            data: tasksDecorator(
                tasks,
                categories,
                tags
            ),
        });
    } catch (error) {
        console.error(
            "Error al listar tareas:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};


const updateTask = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { id } = req.params;

        const {
            title,
            description = null,
            is_completed,
            category_id,
            user_id,
            tags = [],
        } = req.body;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message:
                    "El id de la tarea no es válido.",
            });
        }

        if (!title?.trim() || !category_id || !user_id) {
            return res.status(400).json({
                message:
                    "El título, la categoría y el usuario son obligatorios.",
            });
        }

        if (!isValidTaskStatus(is_completed)) {
            return res.status(400).json({
                message:
                    "El estado de la tarea no es válido.",
            });
        }

        if (!Array.isArray(tags)) {
            return res.status(400).json({
                message:
                    "Las etiquetas deben enviarse como un arreglo.",
            });
        }

        if (
            description !== null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                message:
                    "La descripción debe ser una cadena de texto.",
            });
        }

        const normalizedTitle = title.trim();
        const normalizedDescription =
            description?.trim() || null;

        const uniqueTags = [...new Set(tags)];

        connection = await pool.getConnection();

        const [existingTasks] =
            await connection.execute(
                `
                    SELECT id
                    FROM tasks
                    WHERE id = ?
                    AND user_id = ?
                    LIMIT 1
                `,
                [id, user_id]
            );

        if (existingTasks.length === 0) {
            return res.status(404).json({
                message: "Tarea no encontrada.",
            });
        }

        const [categories] =
            await connection.execute(
                `
                    SELECT
                        id,
                        name
                    FROM categories
                    WHERE id = ?
                    AND user_id = ?
                    LIMIT 1
                `,
                [category_id, user_id]
            );

        if (categories.length === 0) {
            return res.status(400).json({
                message:
                    "La categoría no existe o no pertenece al usuario.",
            });
        }

        let existingTags = [];

        if (uniqueTags.length > 0) {
            const placeholders = uniqueTags
                .map(() => "?")
                .join(",");

            [existingTags] =
                await connection.execute(
                    `
                        SELECT
                            id,
                            name
                        FROM tags
                        WHERE user_id = ?
                        AND id IN (${placeholders})
                    `,
                    [user_id, ...uniqueTags]
                );

            if (
                existingTags.length !==
                uniqueTags.length
            ) {
                return res.status(400).json({
                    message:
                        "Una o más etiquetas no existen o no pertenecen al usuario.",
                });
            }
        }

        await connection.beginTransaction();
        transactionStarted = true;

        await connection.execute(
            `
                UPDATE tasks
                SET
                    title = ?,
                    description = ?,
                    is_completed = ?,
                    category_id = ?
                WHERE id = ?
                AND user_id = ?
            `,
            [
                normalizedTitle,
                normalizedDescription,
                is_completed,
                category_id,
                id,
                user_id,
            ]
        );

        await connection.execute(
            `
                DELETE FROM tags_task
                WHERE task_id = ?
            `,
            [id]
        );

        for (const tagId of uniqueTags) {
            await connection.execute(
                `
                    INSERT INTO tags_task (
                        tag_id,
                        task_id
                    )
                    VALUES (?, ?)
                `,
                [tagId, id]
            );
        }

        await connection.commit();
        transactionStarted = false;

        const task = taskDecorator({
            id,
            title: normalizedTitle,
            description: normalizedDescription,
            is_completed,
            category_id,
            category_name: categories[0].name,
            user_id,
            tags: existingTags,
        });

        return res.status(200).json({
            data: task,
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error(
            "Error al actualizar tarea:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    } finally {
        connection?.release();
    }
};


const deleteTask = async (req, res) => {
    let connection;
    let transactionStarted = false;

    try {
        const { id } = req.params;
        const { user_id } = req.query;

        if (!isValidUUID(id)) {
            return res.status(400).json({
                message:
                    "El id de la tarea no es válido.",
            });
        }

        if (!user_id) {
            return res.status(400).json({
                message: "El usuario es obligatorio.",
            });
        }

        connection = await pool.getConnection();

        const [tasks] = await connection.execute(
            `
                SELECT id
                FROM tasks
                WHERE id = ?
                AND user_id = ?
                LIMIT 1
            `,
            [id, user_id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({
                message: "Tarea no encontrada.",
            });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        await connection.execute(
            `
                DELETE FROM tags_task
                WHERE task_id = ?
            `,
            [id]
        );

        await connection.execute(
            `
                DELETE FROM tasks
                WHERE id = ?
                AND user_id = ?
            `,
            [id, user_id]
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            message:
                "Tarea eliminada correctamente.",
        });
    } catch (error) {
        if (connection && transactionStarted) {
            await connection.rollback();
        }

        console.error(
            "Error al eliminar tarea:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    } finally {
        connection?.release();
    }
};


export {
    store,
    index,
    updateTask,
    deleteTask,
};