import 'dotenv/config';
import mysql from 'mysql2/promise';


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});


const testConnection = async () => {
    const connection = await pool.getConnection();

    try {
        const [rows] = await connection.query(
            'SELECT 1 AS connection_test'
        );

        console.log(
            'Conexión a MySQL establecida correctamente.'
        );

        console.log(
            'Resultado de prueba:',
            rows[0]
        );
    } finally {
        connection.release();
    }
};


export {
    pool,
    testConnection,
};