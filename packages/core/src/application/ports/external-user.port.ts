export interface ExternalUserProfile {
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
}

export interface IExternalUserHttpPort {
  fetchRandomProfile(): Promise<ExternalUserProfile>;
}