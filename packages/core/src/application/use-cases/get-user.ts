import { UserId, UserNotFoundError } from '../../domain/entities/user.js';
import type { IUserRepository } from '../ports/user.ports.js';
import type { UserResponse } from '../contracts/user.response.js';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(id: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(UserId.create(id));
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
