import type { IUserRepository } from '../../../domain/ports/IUserRepository';
import type { User } from '@flashlearn/shared';

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(userId: string): Promise<User | null> {
    const user = await this.userRepository.findById(userId);
    return user ? user.toJSON() : null;
  }
}
