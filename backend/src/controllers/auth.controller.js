import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OfficerModel } from "../models/officers.model.js";
import ResponseHandler from "../utils/ResponseHandler.js";

// SIGNUP: Create new Officer
export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password || !role) {
      const error = new Error("All fields are required");
      error.status = 400;
      return next(error);
    }

    // HASHING ONCE RIGHT HERE
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Pass the already-hashed password to the model
    const newOfficer = await OfficerModel.create(
      fullName, 
      email, 
      passwordHash, 
      role
    );

    return ResponseHandler.SuccessResponse(
      res,
      "Officer registered successfully",
      { officer: newOfficer },
      201
    );
  } catch (err) {
    next(err);
  }
};

// LOGIN: Authenticate and issue JWT
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const officer = await OfficerModel.findByEmail(email);
    console.log(officer.id);
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

    // 4. Send clean response
        return ResponseHandler.SuccessResponse(
            res,
            "Login successful",
            {
                token,
                user: {
                    id: officer.id,
                    fullName: officer.full_name,
                    role: officer.role
                }
            }
        );
    } catch (err) {
        next(err);
    }
};