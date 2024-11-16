class ApiError extends Error {
    constructor(status, message = "Something went wrong", error = [], stack = "") {
        super(message);
        this.status = status;
        this.message = message;
        this.error = error;
        this.data = null
        this.stack = stack;
        this.success = false
        if (stack) {
            this.stack = stack
        }
        else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}

export default ApiError