import pkg from 'pg';
const { Pool } = pkg;
import 'dotenv/config';

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const connectDB = async () => {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log(`✅ PostgreSQL Connected! Server Time: ${res.rows[0].now}`);
    } catch (error) {
        console.error("❌ PostgreSQL connection error:", error);
        process.exit(1);
    }
};

export { pool, connectDB };