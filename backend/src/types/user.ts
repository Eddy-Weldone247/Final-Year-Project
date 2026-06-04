/** A user representation that is safe to expose over the API (no secrets). */
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  isEmailVerified: boolean;
  createdAt: Date;
}
