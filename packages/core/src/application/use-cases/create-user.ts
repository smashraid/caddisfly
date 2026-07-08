import { User, DuplicateEmailError } from '../../index.js';
import { IUserRepositoryPort, IEventPublisherPort } from '../ports/user.ports.js';
import { CreateUserRequest, UserCreatedResponse } from '../contracts/index.js';

export class CreateUserUseCase {
  constructor(
    private readonly userRepo: IUserRepositoryPort,
    private readonly eventPublisher: IEventPublisherPort,
  ) {}

  async execute(input: CreateUserRequest): Promise<UserCreatedResponse> {
    // 1. Validate email uniqueness directly using primitive string
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError(input.email);
    }

    // 2. Create domain aggregate (Zod schema executes internal validation rules natively)
    const user = User.create({ email: input.email, name: input.name });

    // 3. Persist through port
    await this.userRepo.save(user);

    // 4. Publish modern union type events
    const events = user.pullDomainEvents();
    if (events.length > 0) {
      await this.eventPublisher.publishBatch(events);
    }

    // 5. Return explicit contract
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    };
  }
}