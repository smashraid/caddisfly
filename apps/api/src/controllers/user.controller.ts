import type { Request, Response } from 'express';
import {
  CreateUserUseCase,
  GetUserUseCase,
  UpdateUserUseCase,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@caddisfly/core';
import type { IUserRepositoryPort, IEventPublisherPort } from '@caddisfly/core';

export interface UserControllerDependencies {
  userRepository: IUserRepositoryPort;
  eventPublisher: IEventPublisherPort;
}

// Typed request with id param
interface UserIdRequest extends Request {
  params: { id: string };
}

export class UserController {
  private readonly createUser: CreateUserUseCase;
  private readonly getUser: GetUserUseCase;
  private readonly updateUser: UpdateUserUseCase;

  constructor(deps: UserControllerDependencies) {
    this.createUser = new CreateUserUseCase(deps.userRepository, deps.eventPublisher);
    this.getUser = new GetUserUseCase(deps.userRepository);
    this.updateUser = new UpdateUserUseCase(deps.userRepository, deps.eventPublisher);
  }

  async create(req: Request, res: Response): Promise<void> {
    const response = await this.createUser.execute(req.body as CreateUserRequest);
    res.status(201).json(response);
  }

  async getById(req: UserIdRequest, res: Response): Promise<void> {
    const id = req.params.id; // now typed as string, not string | string[] | undefined
    const response = await this.getUser.execute(id);
    res.status(200).json(response);
  }

  async update(req: UserIdRequest, res: Response): Promise<void> {
    const id = req.params.id; // now typed as string
    const response = await this.updateUser.execute(id, req.body as UpdateUserRequest);
    res.status(200).json(response);
  }
}