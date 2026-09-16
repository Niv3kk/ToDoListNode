import "dotenv/config";
import express from "express";
import cors from "cors";

import userRoutes from "./routes/user.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import taskRoutes from "./routes/task.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { testConnection } from "./db/connection.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

const app = express();

const PORT = process.env.PORT || 3000;

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "To-Do List API funcionando correctamente",
    });
});

app.use("/users", userRoutes);
app.use("/auth", authRoutes);

app.use(
    "/categories",
    authMiddleware,
    categoryRoutes
);

app.use(
    "/tags",
    authMiddleware,
    tagRoutes
);

app.use(
    "/tasks",
    authMiddleware,
    taskRoutes
);

app.use((req, res) => {
    res.status(404).json({
        message: "Not Found",
    });
});

const startServer = async () => {
    try {
        await testConnection();

        app.listen(PORT, () => {
            console.log(
                `Servidor ejecutándose en http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error(
            "Error al conectar con MySQL:",
            error.message
        );

        process.exit(1);
    }
};

startServer();