import { randomUUID } from "node:crypto";

import { pool } from "../db/connection.js";
import {
  categoryDecorator,
  categoriesDecorator,
} from "../decorators/category.decorator.js";
import { isValidUUID } from "../utils/uuid.util.js";

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "El nombre de la categoría es obligatorio.",
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
      [id, normalizedName, userId]
    );

    const category = categoryDecorator({
      id,
      name: normalizedName,
      user_id: userId,
    });

    return res.status(201).json({
      data: category,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "Ya existe una categoría con ese nombre.",
      });
    }

    console.error(
      "Error al crear categoría:",
      error.message
    );

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const userId = req.user.id;

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
      [userId]
    );

    return res.status(200).json({
      data: categoriesDecorator(categories),
    });
  } catch (error) {
    console.error(
      "Error al listar categorías:",
      error.message
    );

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        message:
          "El id de la categoría no es válido.",
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        message:
          "El nombre de la categoría es obligatorio.",
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
      [normalizedName, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Categoría no encontrada.",
      });
    }

    const category = categoryDecorator({
      id,
      name: normalizedName,
      user_id: userId,
    });

    return res.status(200).json({
      message:
        "Categoría actualizada correctamente.",
      data: category,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "Ya existe una categoría con ese nombre.",
      });
    }

    console.error(
      "Error al actualizar categoría:",
      error.message
    );

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        message:
          "El id de la categoría no es válido.",
      });
    }

    const [categories] = await pool.execute(
      `
                SELECT
                    id,
                    name,
                    user_id
                FROM categories
                WHERE id = ?
                AND user_id = ?
                LIMIT 1
            `,
      [id, userId]
    );

    if (categories.length === 0) {
      return res.status(404).json({
        message: "Categoría no encontrada.",
      });
    }

    const backup = categoryDecorator(
      categories[0]
    );

    await pool.execute(
      `
                DELETE FROM categories
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
          "La categoría está asociada a una o más tareas y no puede eliminarse.",
      });
    }

    console.error(
      "Error al eliminar categoría:",
      error.message
    );

    return res.status(500).json({
      message: "Error interno del servidor.",
    });
  }
};

export {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};