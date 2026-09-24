import type { UserRole } from '@flashlearn/shared';

export interface UserProps {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  googleId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UserEntity {
  constructor(public readonly props: UserProps) {}

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get avatar(): string | null {
    return this.props.avatar;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get googleId(): string | null {
    return this.props.googleId;
  }

  isSuperadmin(): boolean {
    return this.props.role === 'superadmin';
  }

  isCreator(): boolean {
    return this.props.role === 'creator' || this.props.role === 'superadmin';
  }

  toJSON() {
    return {
      id: this.props.id,
      email: this.props.email,
      name: this.props.name,
      avatar: this.props.avatar,
      role: this.props.role,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
    };
  }
}
