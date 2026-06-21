// Extends Express Request to carry authenticated user data after requireAuth
declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
