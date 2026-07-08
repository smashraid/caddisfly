// ─── Value Object: UserId ───────────────────────────────────────────────────
export type UserId = string & { readonly __brand: 'UserId' };

export const UserId = {
  create(value: string): UserId {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
    return value as UserId;
  },
  generate(): UserId {
    return crypto.randomUUID() as UserId;
  },
};

// ─── Value Object: Email ────────────────────────────────────────────────────
export class Email {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(trimmed);
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }

  get value(): string {
    return this._value;
  }
}

// ─── Value Object: UserName ─────────────────────────────────────────────────
export class UserName {
  private constructor(private readonly _value: string) {}

  static create(raw: string): UserName {
    const trimmed = raw.trim();
    if (trimmed.length < 2) {
      throw new InvalidUserNameError('Name must be at least 2 characters');
    }
    if (trimmed.length > 100) {
      throw new InvalidUserNameError('Name must be at most 100 characters');
    }
    return new UserName(trimmed);
  }

  toString(): string {
    return this._value;
  }

  get value(): string {
    return this._value;
  }
}

// ─── Domain Events (inline definitions) ─────────────────────────────────────
export class UserCreatedEvent {
  readonly occurredAt: Date;
  readonly eventType = 'UserCreated' as const;

  constructor(
    readonly aggregateId: UserId,
    readonly email: Email,
    readonly name: UserName,
    occurredAt?: Date
  ) {
    this.occurredAt = occurredAt ?? new Date();
  }
}

export class UserUpdatedEvent {
  readonly occurredAt: Date;
  readonly eventType = 'UserUpdated' as const;

  constructor(
    readonly aggregateId: UserId,
    readonly changes: Partial<{ email: Email; name: UserName }>,
    occurredAt?: Date
  ) {
    this.occurredAt = occurredAt ?? new Date();
  }
}

// ─── Domain Errors (inline definitions) ─────────────────────────────────────
export class InvalidEmailError extends Error {
  constructor(email: string) {
    super(`Invalid email format: ${email}`);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidUserNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserNameError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`User not found: ${userId}`);
    this.name = 'UserNotFoundError';
  }
}

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already in use: ${email}`);
    this.name = 'DuplicateEmailError';
  }
}

// ─── Aggregate Root: User ───────────────────────────────────────────────────
export interface UserProps {
  id: UserId;
  email: Email;
  name: UserName;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private _domainEvents: Array<UserCreatedEvent | UserUpdatedEvent> = [];

  private constructor(private props: UserProps) {}

  // ─── Factory: Create new user ───
  static create(input: { email: string; name: string }): User {
    const now = new Date();
    const user = new User({
      id: UserId.generate(),
      email: Email.create(input.email),
      name: UserName.create(input.name),
      createdAt: now,
      updatedAt: now,
    });

    user._domainEvents.push(
      new UserCreatedEvent(user.props.id, user.props.email, user.props.name)
    );

    return user;
  }

  // ─── Factory: Reconstitute from persistence ───
  static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // ─── Business Methods ───
  updateName(newName: string): void {
    this.props.name = UserName.create(newName);
    this.props.updatedAt = new Date();
    this._domainEvents.push(
      new UserUpdatedEvent(this.props.id, { name: this.props.name })
    );
  }

  updateEmail(newEmail: string): void {
    this.props.email = Email.create(newEmail);
    this.props.updatedAt = new Date();
    this._domainEvents.push(
      new UserUpdatedEvent(this.props.id, { email: this.props.email })
    );
  }

  // ─── Domain Events ───
  pullDomainEvents(): Array<UserCreatedEvent | UserUpdatedEvent> {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  // ─── Getters ───
  get id(): UserId { return this.props.id; }
  get email(): Email { return this.props.email; }
  get name(): UserName { return this.props.name; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}
