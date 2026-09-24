import { randomBytes, createHash } from 'crypto';
import type { IApiKeyRepository } from '../../../domain/ports/IApiKeyRepository';
import type { CreateApiKeyRequest, CreateApiKeyResponse } from '@flashlearn/shared';

export class CreateApiKeyUseCase {
  constructor(private readonly apiKeyRepository: IApiKeyRepository) {}

  async execute(userId: string, input: CreateApiKeyRequest): Promise<CreateApiKeyResponse> {
    const rawSecret = randomBytes(24).toString('hex');
    const fullKey = `fl_live_${rawSecret}`;
    const keyPrefix = `fl_live_${rawSecret.slice(0, 6)}...`;

    const hashedKey = createHash('sha256').update(fullKey).digest('hex');

    let expiresAt: Date | null = null;
    if (input.expiresInDays && input.expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);
    }

    const entity = await this.apiKeyRepository.create({
      userId,
      name: input.name,
      keyPrefix,
      hashedKey,
      permissions: input.permissions && input.permissions.length > 0 ? input.permissions : ['*'],
      expiresAt,
    });

    return {
      key: fullKey,
      apiKey: entity.toJSON(),
    };
  }
}
