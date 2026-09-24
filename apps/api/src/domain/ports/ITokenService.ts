import type { UserRole } from '@flashlearn/shared';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ITokenService {
  signToken(payload: TokenPayload, expiresIn?: string): string;
  verifyToken(token: string): TokenPayload | null;
}
