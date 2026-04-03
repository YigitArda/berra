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

export type FeedPost = {
  id: number;
  body: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  username: string;
  avatar_url: string | null;
};
