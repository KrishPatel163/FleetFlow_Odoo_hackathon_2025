class ResponseHandler {
    static SuccessResponse(
        res,
        message = "success",
        data = {},
        statusCode = 200
    ) {
        return res.status(statusCode).json({
            success: true,
            statusCode,
            data,
            message,
        });
    }
    static ErrorResponse(res, message = "error", statusCode = 400, error = {}) {
        return res.status(statusCode).json({
            success: false,
            statusCode,
            error,
            message,
        });
    }
}

export default ResponseHandler;