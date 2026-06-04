import type { PublicUser } from './user';

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware on protected routes. */
      user?: PublicUser;
    }
  }
}

export {};
