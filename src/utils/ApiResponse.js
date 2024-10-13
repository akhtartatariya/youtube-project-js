class ApiResponse {
    constructor(statusCode, message = "Something went wrong", data = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data
        this.success = statusCode < 400 ? true : false
    }
}

export default ApiResponse