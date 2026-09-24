import type { UserEntity } from '../entities/User';
import type { UserRole } from '@flashlearn/shared';

export interface CreateUserData {
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  googleId: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findByGoogleId(googleId: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  updateRole(id: string, role: UserRole): Promise<UserEntity | null>;
  listAll(): Promise<UserEntity[]>;
}
