import { pool } from "../db/index.js";
import bcrypt from "bcryptjs";

export const OfficerModel = {
    // 1. Create a new officer (Used by a Super Admin or during setup)
    create: async (name, email, plainPassword, role) => {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(plainPassword, salt);
        
        const res = await pool.query(
            "INSERT INTO officers (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, full_name, role",
            [name, email, hash, role]
        );
        return res.rows[0];
    },

    // 2. Find by Email (For login)
    findByEmail: async (email) => {
        const res = await pool.query("SELECT * FROM officers WHERE email = $1", [email]);
        return res.rows[0];
    }
};