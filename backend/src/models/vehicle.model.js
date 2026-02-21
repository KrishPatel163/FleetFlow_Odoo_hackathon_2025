import { pool } from "../db/index.js";
import { z } from "zod";

// 1. Zod Schema for Validation
export const VehicleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  plate: z.string().toUpperCase(),
  max_capacity: z.number().positive(),
  acquisition_cost: z.number().optional(),
});

// 2. Database Interactors (The "Model" logic)
export const VehicleModel = {
  // Get all available vehicles for the dispatcher
  getAvailable: async () => {
    const res = await pool.query(
      "SELECT * FROM vehicles WHERE status = $1 ORDER BY name ASC", 
      ['Available']
    );
    return res.rows;
  },

  // Update status (e.g., to 'In Shop' or 'On Trip')
  updateStatus: async (id, status) => {
    const res = await pool.query(
      "UPDATE vehicles SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    return res.rows[0];
  }
};