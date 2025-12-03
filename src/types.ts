export interface User {
  id: number;
  username: string;
  created_at: string;
}

export interface Recording {
  id: number;
  user_id: number;
  filename: string;
  original_name: string;
  type: 'voice' | 'drum';
  size: number;
  duration: number | null;
  created_at: string;
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    username?: string;
  }
}
