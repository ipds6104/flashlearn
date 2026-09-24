import type { ApiKeyEntity } from '../entities/ApiKey';

export interface CreateApiKeyData {
  userId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  permissions: string[];
  expiresAt: Date | null;
}

export interface IApiKeyRepository {
  findById(id: string): Promise<ApiKeyEntity | null>;
  findByHashedKey(hashedKey: string): Promise<ApiKeyEntity | null>;
  listByUser(userId: string): Promise<ApiKeyEntity[]>;
  listAll(): Promise<ApiKeyEntity[]>;
  create(data: CreateApiKeyData): Promise<ApiKeyEntity>;
  updateLastUsed(id: string): Promise<void>;
  delete(id: string): Promise<boolean>;
}
