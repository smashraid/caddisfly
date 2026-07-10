import * as z from 'zod';
import { DomainValidationError } from '../errors/user.errors.js';
import type { UserCreatedEvent, UserUpdatedEvent } from '../events/user.events.js';

// ─── Zod Schemas (validation stays in domain) ───────────────────────────────
export const UserIdSchema = z.uuid().brand<'UserId'>();
export type UserId = z.infer<typeof UserIdSchema>;

export const EmailSchema = z.email({ message: "Invalid email format" });
export const UserNameSchema = z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name must be at most 100 characters");

export const UserPropsSchema = z.object({
  id: UserIdSchema,
  email: EmailSchema,
  name: UserNameSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProps = z.infer<typeof UserPropsSchema>;

// ─── Aggregate Root: User ───────────────────────────────────────────────────
export class User {
  private _domainEvents: (UserCreatedEvent | UserUpdatedEvent)[] = [];

  private constructor(private props: UserProps) { }

  private static validate(data: unknown): UserProps {
    const result = UserPropsSchema.safeParse(data);
    if (!result.success) {
      throw new DomainValidationError(result.error.issues);
    }
    return result.data;
  }

  static create(input: { email: string; name: string }): User {
    const now = new Date();
    const props = User.validate({
      id: crypto.randomUUID(),
      email: input.email,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    });

    const user = new User(props);
    user._domainEvents.push({
      eventType: 'UserCreated',
      aggregateId: user.props.id,
      email: user.props.email,
      name: user.props.name,
      occurredAt: now,
    });

    return user;
  }

  static reconstitute(props: unknown): User {
    return new User(User.validate(props));
  }

  updateName(newName: string): void {
    const parsedName = UserNameSchema.parse(newName);
    this.props.name = parsedName;
    this.props.updatedAt = new Date();

    this._domainEvents.push({
      eventType: 'UserUpdated',
      aggregateId: this.props.id,
      changes: { name: parsedName },
      occurredAt: this.props.updatedAt,
    });
  }

  updateEmail(newEmail: string): void {
    const parsedEmail = EmailSchema.parse(newEmail);
    this.props.email = parsedEmail;
    this.props.updatedAt = new Date();

    this._domainEvents.push({
      eventType: 'UserUpdated',
      aggregateId: this.props.id,
      changes: { email: parsedEmail },
      occurredAt: this.props.updatedAt,
    });
  }

  pullDomainEvents(): (UserCreatedEvent | UserUpdatedEvent)[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  get id(): UserId { return this.props.id; }
  get email(): string { return this.props.email; }
  get name(): string { return this.props.name; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
}