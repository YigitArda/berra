export type CachePatchStrategy = 'invalidate' | 'setQueryData';

/**
 * Standardized cache patch policy for realtime events and mutation side-effects.
 * - invalidate: use when server recalculation/order is unknown.
 * - setQueryData: use when payload is deterministic and can be patched safely.
 */
export const CACHE_PATCH_STRATEGY = {
  FEED_CREATE_POST: 'invalidate',
  NOTIFICATIONS_MARK_ALL_READ: 'setQueryData',
  NOTIFICATION_CREATED_EVENT: 'setQueryData',
} as const satisfies Record<string, CachePatchStrategy>;
