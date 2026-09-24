import type { IApiKeyRepository } from '../../../domain/ports/IApiKeyRepository';
import type { UserRole } from '@flashlearn/shared';

export class RevokeApiKeyUseCase {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

  async execute(keyId: string, currentUserId: string, role: UserRole): Promise<boolean> {
    const isSuperadmin = role === 'superadmin';
    const existing = await this.apiKeyRepository.findById(keyId);

    if (!existing) {
      throw new Error('API Key not found');
    }

    if (existing.userId !== currentUserId && !isSuperadmin) {
      throw new Error('Forbidden: You can only revoke your own API keys');
    }

    return await this.apiKeyRepository.delete(keyId);
  }
}
