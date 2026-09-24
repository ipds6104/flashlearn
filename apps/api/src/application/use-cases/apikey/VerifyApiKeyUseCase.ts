import { createHash } from 'crypto';
import type { IApiKeyRepository } from '../../../domain/ports/IApiKeyRepository';
import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { User } from '@flashlearn/shared';

export interface VerifiedApiKeyContext {
  user: User;
  permissions: string[];
  keyId: string;
}

export class VerifyApiKeyUseCase {
  constructor(
    private readonly apiKeyRepository: IApiKeyRepository,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(rawKey: string): Promise<VerifiedApiKeyContext | null> {
    if (!rawKey.startsWith('fl_live_')) {
      return null;
    }

    const hashedKey = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.apiKeyRepository.findByHashedKey(hashedKey);

    if (!apiKey) return null;
    if (apiKey.isExpired()) return null;

    const user = await this.userRepository.findById(apiKey.userId);
    if (!user) return null;

    // Fire and forget last used update
    this.apiKeyRepository.updateLastUsed(apiKey.id).catch(() => {});

    return {
      user: user.toJSON(),
      permissions: apiKey.permissions,
      keyId: apiKey.id,
    };
  }
}
