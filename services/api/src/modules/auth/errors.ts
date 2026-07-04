export class AuthError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "AuthError";
  }
}

export class EmailAlreadyRegisteredError extends AuthError {
  constructor() {
    super("Email is already registered", 409);
  }
}

export class InvalidCredentialsError extends AuthError {
  constructor() {
    super("Invalid email or password", 401);
  }
}
