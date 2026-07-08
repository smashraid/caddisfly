// ─── Single User Response ───────────────────────────────────────────────────
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// ─── User Created Response ──────────────────────────────────────────────────
export interface UserCreatedResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ─── Paginated Users Response ─────────────────────────────────────────────────
export interface PaginatedUsersResponse {
  data: UserResponse[];
  total: number;
  limit: number;
  offset: number;
}
