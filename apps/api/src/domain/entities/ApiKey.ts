export interface ApiKeyProps {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  hashedKey: string;
  permissions: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export class ApiKeyEntity {
  constructor(public readonly props: ApiKeyProps) {}

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get name(): string {
    return this.props.name;
  }

  get keyPrefix(): string {
    return this.props.keyPrefix;
  }

  get hashedKey(): string {
    return this.props.hashedKey;
  }

  get permissions(): string[] {
    return this.props.permissions;
  }

  isExpired(): boolean {
    if (!this.props.expiresAt) return false;
    return new Date() > this.props.expiresAt;
  }

  hasPermission(permission: string): boolean {
    if (this.props.permissions.includes('*')) return true;
    return this.props.permissions.includes(permission);
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      name: this.props.name,
      keyPrefix: this.props.keyPrefix,
      permissions: this.props.permissions,
      expiresAt: this.props.expiresAt ? this.props.expiresAt.toISOString() : null,
      lastUsedAt: this.props.lastUsedAt ? this.props.lastUsedAt.toISOString() : null,
      createdAt: this.props.createdAt.toISOString(),
    };
  }
}
