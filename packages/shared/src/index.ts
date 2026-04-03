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
