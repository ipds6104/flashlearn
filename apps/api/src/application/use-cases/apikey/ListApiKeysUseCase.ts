import type { IApiKeyRepository } from '../../../domain/ports/IApiKeyRepository';
import type { ApiKeyItem, UserRole } from '@flashlearn/shared';

export class ListApiKeysUseCase {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

  async execute(userId: string, role: UserRole): Promise<ApiKeyItem[]> {
    if (role === 'superadmin') {
      const all = await this.apiKeyRepository.listAll();
      return all.map((k) => k.toJSON());
    }

    const userKeys = await this.apiKeyRepository.listByUser(userId);
    return userKeys.map((k) => k.toJSON());
  }
}
