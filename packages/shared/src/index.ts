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

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type AuthResponse = {
  message: string;
  user: AuthUser;
};

export type AuthSuccess = AuthResponse;

export type FeedPost = {
  id: number;
  body: string;
  like_count: number;
  comment_count: number;
  created_at: string;
  username: string;
  avatar_url: string | null;
};

export type CreateFeedRequest = {
  body: string;
};

export type FeedListResponse = {
  posts: FeedPost[];
  page: number;
  limit: number;
  total: number;
};

export type FeedCreateResponse = {
  post: {
    id: number;
    body: string;
    created_at: string;
  };
};

export type SearchResult = {
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

export type SearchRequest = {
  q: string;
  filters?: string;
  page?: number;
};

export type SearchResponse = {
  results: SearchResult[];
  query: string;
  page: number;
  total: number;
  limit: number;
};

export type SystemNotificationJob = {
  userId: number;
  type: 'system';
  message: string;
  link?: string;
};

export type PublicProfile = {
  id: number;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  role: 'user' | 'mod' | 'admin';
  created_at: string;
};

export type ApiError = {
  statusCode: number;
  path: string;
  method: string;
  message: string | string[];
  timestamp: string;
};

export * from './env';
export * from './utils';
