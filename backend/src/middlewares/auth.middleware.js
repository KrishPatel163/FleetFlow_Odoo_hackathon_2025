import jwt from "jsonwebtoken";
import ResponseHandler from "../utils/ResponseHandler.js";

export const verifyJWT = (req, res, next) => {
    try {
        // 1. Get token from header (Format: "Bearer <token>")
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (!token) {
            const error = new Error("Authentication token missing");
            error.status = 401;
            return next(error);
        }

        // 2. Verify token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                const error = new Error("Session expired or invalid token");
                error.status = 403;
                return next(error);
            }

            // 3. Attach decoded data (id and role) to request
            req.user = decoded;
            next();
        });
    } catch (err) {
        next(err);
    }
};

// Bonus: Role-specific bouncer
export const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const error = new Error("Access denied: Insufficient permissions");
            error.status = 403;
            return next(error);
        }
        next();
    };
};