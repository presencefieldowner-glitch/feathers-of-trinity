import type { PrismaClient } from "../../generated/prisma/index.js";
import { authEvents } from "../../realtime/authEvents.js";
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from "./errors.js";
import { hashPassword, verifyPassword } from "./password.js";
import { signToken } from "./jwt.js";

export interface AuthResult {
  user: { id: string; email: string; createdAt: Date };
  session: { id: string };
  token: string;
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(email: string, password: string): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new EmailAlreadyRegisteredError();
    }

    const passwordHash = await hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash },
    });

    return this.createSession(user);
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return this.createSession(user);
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true },
    });
  }

  async revokeSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    authEvents.emit("session:revoked", {
      sessionId: session.id,
      userId,
      revokedAt: session.revokedAt!.toISOString(),
    });
  }

  private async createSession(user: {
    id: string;
    email: string;
    createdAt: Date;
  }): Promise<AuthResult> {
    const session = await this.prisma.session.create({
      data: { userId: user.id },
    });

    const token = signToken({ sub: user.id, email: user.email });

    authEvents.emit("session:created", {
      sessionId: session.id,
      userId: user.id,
      email: user.email,
      createdAt: session.createdAt.toISOString(),
    });

    return {
      user: { id: user.id, email: user.email, createdAt: user.createdAt },
      session: { id: session.id },
      token,
    };
  }
}
