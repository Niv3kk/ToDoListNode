import 'dotenv/config';
import express from 'express';

import {
    testConnection,
} from './db/connection.js';


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
            'Error al conectar con MySQL:',
            error.message
        );

        process.exit(1);
    }
};


startServer();