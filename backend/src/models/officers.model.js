import { pool } from "../db/index.js";

export const OfficerModel = {
  // Just the SQL, no business logic
  create: async (fullName, email, passwordHash, role) => {
    const query = `
      INSERT INTO officers (full_name, email, password_hash, role) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, full_name, email, role, created_at
    `;
    const values = [fullName, email, passwordHash, role];
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  findByEmail: async (email) => {
    const res = await pool.query("SELECT * FROM officers WHERE email = $1", [email]);
    return res.rows[0];
  }
};