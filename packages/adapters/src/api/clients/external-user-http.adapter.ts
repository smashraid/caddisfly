import { type IExternalUserHttpPort, type ExternalUserProfile } from '@caddisfly/core';

// ─── 1. Define the Expected Remote API Response Layout ───────────────────────
interface RandomUserResponse {
  results: Array<{
    name: {
      first: string;
      last: string;
    };
    email: string;
    picture: {
      large: string;
    };
  }>;
}

// ─── 2. Implement the Port ───────────────────────────────────────────────────
export class ExternalUserHttpAdapter implements IExternalUserHttpPort {
  constructor(private readonly baseUrl: string) {}

  async fetchRandomProfile(): Promise<ExternalUserProfile> {
    const response = await fetch(this.baseUrl);

    if (!response.ok) {
      throw new Error(`External User API failed with status: ${response.status}`);
    }

    // Cast raw input securely to our local response representation
    const body = (await response.json()) as RandomUserResponse;
    const result = body.results[0];

    if (!result) {
      throw new Error('External User API returned an empty results array');
    }

    // ─── 3. Anti-Corruption Mapping Layer ─────────────────────────────────────
    return {
      firstName: result.name.first,
      lastName: result.name.last,
      email: result.email,
      avatarUrl: result.picture?.large ?? result.picture.large,
    };
  }
}