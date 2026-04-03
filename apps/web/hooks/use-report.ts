'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useReportContent() {
  // CUTOVER_PROXY: `/reports` requests go through Nest API and are proxied during migration.
  return useMutation({
    mutationFn: (payload: { targetType: 'post' | 'feed_post' | 'feed_comment'; targetId: number; reason: string }) =>
      apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify({
          target_type: payload.targetType,
          target_id: payload.targetId,
          reason: payload.reason,
        }),
      }),
  });
}
