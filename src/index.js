import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;


app.use(express.json());


app.get('/', (req, res) => {
    res.json({
        message: 'To-Do List API funcionando correctamente',
    });
});


app.use((req, res) => {
    res.status(404).json({
        message: 'Not Found',
    });
});


app.listen(PORT, () => {
    console.log(
        `Servidor ejecutándose en http://localhost:${PORT}`
    );
});