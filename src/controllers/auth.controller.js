import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OfficerModel } from "../models/officer.model.js";
import ResponseHandler from "../utils/ResponseHandler.js";

// SIGNUP: Create new Officer
export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Simple validation (can also use Zod here)
    if (!fullName || !email || !password || !role) {
      const error = new Error("All fields are required");
      error.status = 400;
      return next(error);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save to DB
    const newOfficer = await OfficerModel.create(fullName, email, passwordHash, role);

    return ResponseHandler.SuccessResponse(
      res,
      "Officer registered successfully",
      { officer: newOfficer },
      201
    );
  } catch (err) {
    next(err); // Handled by your ErrorMiddleware (including duplicate email errors)
  }
};

// LOGIN: Authenticate and issue JWT
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const officer = await OfficerModel.findByEmail(email);
    if (!officer) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      return next(error);
    }

    // Compare Hash
    const isMatch = await bcrypt.compare(password, officer.password_hash);
    if (!isMatch) {
      const error = new Error("Invalid email or password");
      error.status = 401;
      return next(error);
    }

    // Generate Token with Role
    const token = jwt.sign(
      { id: officer.id, role: officer.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return ResponseHandler.SuccessResponse(
      res,
      "Login successful",
      {
        token,
        user: { name: officer.full_name, role: officer.role }
      }
    );
  } catch (err) {
    next(err);
  }
};