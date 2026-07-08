import type { CreateUserUseCase, GetUserUseCase, UpdateUserUseCase } from '@caddisfly/core';
import { DuplicateEmailError, UserNotFoundError } from '@caddisfly/core';
import type { ServerUnaryCall, sendUnaryData, ServiceError } from '@grpc/grpc-js';

// ─── Generated proto types (assumed from your .proto compilation) ─────────────
interface CreateUserRequest {
  email: string;
  name: string;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface GetUserRequest {
  id: string;
}

interface UpdateUserRequest {
  id: string;
  email?: string;
  name?: string;
}

// ─── gRPC Service Implementation ──────────────────────────────────────────────
export function createUserGrpcService(
  createUser: CreateUserUseCase,
  getUser: GetUserUseCase,
  updateUser: UpdateUserUseCase,
) {
  return {
    async CreateUser(
      call: ServerUnaryCall<CreateUserRequest, UserResponse>,
      callback: sendUnaryData<UserResponse>
    ) {
      try {
        const result = await createUser.execute(call.request);
        callback(null, {
          id: result.id,
          email: result.email,
          name: result.name,
          createdAt: result.createdAt,
          updatedAt: result.createdAt, // created response doesn't have updatedAt
        });
      } catch (err) {
        callback(grpcError(err));
      }
    },

    async GetUser(
      call: ServerUnaryCall<GetUserRequest, UserResponse>,
      callback: sendUnaryData<UserResponse>
    ) {
      try {
        const result = await getUser.execute(call.request.id);
        callback(null, result);
      } catch (err) {
        callback(grpcError(err));
      }
    },

    async UpdateUser(
      call: ServerUnaryCall<UpdateUserRequest, UserResponse>,
      callback: sendUnaryData<UserResponse>
    ) {
      try {
        const { id, ...updates } = call.request;
        const result = await updateUser.execute(id, updates);
        callback(null, result);
      } catch (err) {
        callback(grpcError(err));
      }
    },
  };
}

function grpcError(err: unknown): ServiceError {
  const { status } = require('@grpc/grpc-js');

  if (err instanceof UserNotFoundError) {
    return { code: status.NOT_FOUND, message: err.message, name: 'NotFound', details: '' } as ServiceError;
  }
  if (err instanceof DuplicateEmailError) {
    return { code: status.ALREADY_EXISTS, message: err.message, name: 'AlreadyExists', details: '' } as ServiceError;
  }

  return { 
    code: status.INTERNAL, 
    message: (err as Error).message || 'Internal error',
    name: 'InternalError',
    details: ''
  } as ServiceError;
}
