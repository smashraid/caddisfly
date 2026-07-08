import { UserId, UserNotFoundError } from '../../index.js';
import { IUserRepositoryPort } from '../ports/user.ports.js';
import { UserResponse } from '../contracts/index.js';

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepositoryPort) {}

  async execute(id: string): Promise<UserResponse> {
    const user = await this.userRepo.findById(id as UserId);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}