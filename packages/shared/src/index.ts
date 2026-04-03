export type ApiHealth = {
  status: 'ok' | 'error';
  service: string;
  ts: string;
};

export type AuthUser = {
  id: number;
  username: string;
  role: 'user' | 'mod' | 'admin';
};

export type AuthSuccess = {
  message: string;
  user: AuthUser;
  token: string;
};

export type SystemNotificationJob = {
  userId: number;
  type: 'system';
  message: string;
  link?: string;
};
