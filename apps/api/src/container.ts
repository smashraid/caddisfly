// src/container.ts
import { 
  CreateUserUseCase, 
  type IUserRepositoryPort, 
  type IEventPublisherPort 
} from '@caddisfly/core';

export interface ContainerConfig {
  userRepository: IUserRepositoryPort;
  eventPublisher: IEventPublisherPort;
}

export class AppContainer {
  public readonly createUserUseCase: CreateUserUseCase;

  constructor(config: ContainerConfig) {
    this.createUserUseCase = new CreateUserUseCase(
      config.userRepository,
      config.eventPublisher
    );
  }
}