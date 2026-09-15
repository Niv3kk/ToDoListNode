import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
    try {
        const authorization = req.headers.authorization;

        if (!authorization) {
            return res.status(401).json({
                message: "Token de autenticación requerido.",
            });
        }

        const [type, token] = authorization.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).json({
                message: "Formato de token inválido.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "El token ha expirado.",
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Token inválido.",
            });
        }

        console.error(
            "Error al validar token:",
            error.message
        );

        return res.status(500).json({
            message: "Error interno del servidor.",
        });
    }
};

export {
    authMiddleware,
};