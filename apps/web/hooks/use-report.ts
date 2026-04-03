'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useReportContent() {
  // LEGACY_DEPENDENCY: `/reports` endpoints are still served by legacy Express until Nest reports module is migrated.
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
