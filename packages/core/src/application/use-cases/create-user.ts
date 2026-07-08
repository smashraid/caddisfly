import { User, Email, DuplicateEmailError } from '../../domain/entities/user.js';
import type { IUserRepository, IEventPublisher } from '../ports/user.ports.js';
import type { CreateUserRequest } from '../contracts/user.request.js';
import type { UserCreatedResponse } from '../contracts/user.response.js';

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(input: CreateUserRequest): Promise<UserCreatedResponse> {
    // 1. Validate email uniqueness
    const existing = await this.userRepo.findByEmail(Email.create(input.email));
    if (existing) {
      throw new DuplicateEmailError(input.email);
    }

    // 2. Create domain aggregate (validates all invariants)
    const user = User.create({ email: input.email, name: input.name });

    // 3. Persist
    await this.userRepo.save(user);

    // 4. Publish domain events
    const events = user.pullDomainEvents();
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }

    // 5. Return contract (never expose raw entity)
    return {
      id: user.id.toString(),
      email: user.email.toString(),
      name: user.name.toString(),
      createdAt: user.createdAt.toISOString(),
    };
  }
}
