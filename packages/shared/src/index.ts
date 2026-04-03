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

export type PublicProfile = {
  id: number;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'mod' | 'admin';
  created_at: string;
};

export type SearchThreadResult = {
  id: number;
  title: string;
  slug: string;
  reply_count: number;
  view_count: number;
  created_at: string;
  author: string;
  category_name: string;
  rank: number;
};

export type ApiError = {
  statusCode: number;
  path: string;
  method: string;
  message: string | string[];
  timestamp: string;
};
