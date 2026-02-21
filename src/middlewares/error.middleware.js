import ResponseHandler from "../utils/ResponseHandler";

export const ErrorMiddleware = (err, req, res, next) => {
    let statusCode = err.status || 500;
    let message = err.message || "Internal Server Error";

    // Handle PostgreSQL specific errors
    if (err.code === '23505') { // Unique constraint violation
        statusCode = 400;
        message = "A record with this unique value (email/plate) already exists.";
    }

    if (err.code === '23503') { // Foreign key violation
        statusCode = 400;
        message = "Reference error: The linked driver or vehicle does not exist.";
    }

    ResponseHandler.ErrorResponse(
        res,
        message,
        statusCode,
        {
            stack: process.env.NODE_ENV === "dev" ? err.stack : undefined,
            dbCode: err.code // Useful for debugging
        }
    );
};