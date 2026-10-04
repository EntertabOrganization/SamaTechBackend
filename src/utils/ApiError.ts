/**
 * A typed application error carrying an HTTP status code.
 * Thrown from controllers/services and turned into a JSON response by the
 * central error-handling middleware.
 */
export class ApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
