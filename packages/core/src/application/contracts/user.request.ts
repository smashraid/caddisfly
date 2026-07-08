// ─── Create User Request ────────────────────────────────────────────────────
export interface CreateUserRequest {
  email: string;
  name: string;
}

// ─── Update User Request ────────────────────────────────────────────────────
export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

// ─── List Users Request ─────────────────────────────────────────────────────
export interface ListUsersRequest {
  limit?: number;
  offset?: number;
}
