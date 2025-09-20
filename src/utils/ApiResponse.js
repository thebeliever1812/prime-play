export class ApiResponse {
    constructor(statusCode, message = "Success", data) {
        this.success = true
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }
}
