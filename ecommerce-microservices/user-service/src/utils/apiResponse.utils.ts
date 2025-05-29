// Placeholder for API Response Utility
class ApiResponse {
  statusCode: number;
  data: any; // Kept 'any' for flexibility
  message: string;
  success: boolean;

  constructor(statusCode: number, data: any, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400; // Simpler way to determine success
  }
}
export { ApiResponse };
