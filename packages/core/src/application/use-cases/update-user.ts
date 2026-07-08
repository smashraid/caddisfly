import { UserId, UserNotFoundError, DuplicateEmailError } from '../../index.js';
import { IUserRepositoryPort, IEventPublisherPort } from '../ports/user.ports.js';
import { UpdateUserRequest, UserResponse } from '../contracts/index.js';

export class UpdateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepositoryPort,
    private readonly eventPublisher: IEventPublisherPort,
  ) {}

  async execute(id: string, input: UpdateUserRequest): Promise<UserResponse> {
    const userId = id as UserId;
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    if (input.email) {
      const existing = await this.userRepo.findByEmail(input.email);
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
    if (events.length > 0) {
      await this.eventPublisher.publishBatch(events);
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