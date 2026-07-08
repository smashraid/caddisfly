import { UserId, Email, UserNotFoundError, DuplicateEmailError } from '../../domain/entities/user.js';
import type { IUserRepository, IEventPublisher } from '../ports/user.ports.js';
import type { UpdateUserRequest } from '../contracts/user.request.js';
import type { UserResponse } from '../contracts/user.response.js';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(id: string, input: UpdateUserRequest): Promise<UserResponse> {
    const user = await this.userRepo.findById(UserId.create(id));
    if (!user) {
      throw new UserNotFoundError(id);
    }

    if (input.email) {
      const email = Email.create(input.email);
      const existing = await this.userRepo.findByEmail(email);
      if (existing && existing.id !== user.id) {
        throw new DuplicateEmailError(input.email);
      }
      user.updateEmail(input.email);
    }

    if (input.name) {
      user.updateName(input.name);
    }

    await this.userRepo.save(user);

    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
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
