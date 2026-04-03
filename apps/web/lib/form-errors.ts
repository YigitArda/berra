import { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from './api';
import { toUserMessage } from './error-message';

type ErrorRecord = Record<string, string[]>;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }
  return [];
}

function parseFieldErrors(payload: unknown): ErrorRecord {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  const parsed = payload as {
    errors?: unknown;
    fieldErrors?: unknown;
    details?: unknown;
  };

  const buckets = [parsed.errors, parsed.fieldErrors];
  for (const bucket of buckets) {
    if (bucket && typeof bucket === 'object' && !Array.isArray(bucket)) {
      const record = bucket as Record<string, unknown>;
      const mapped = Object.fromEntries(
        Object.entries(record)
          .map(([key, value]) => [key, toStringArray(value)] as const)
          .filter(([, value]) => value.length > 0),
      );
      if (Object.keys(mapped).length > 0) {
        return mapped;
      }
    }

    if (Array.isArray(bucket)) {
      const mapped: ErrorRecord = {};
      for (const entry of bucket) {
        if (!entry || typeof entry !== 'object') {
          continue;
        }
        const item = entry as { field?: unknown; path?: unknown; message?: unknown };
        const key = typeof item.field === 'string' ? item.field : typeof item.path === 'string' ? item.path : null;
        if (!key || typeof item.message !== 'string' || item.message.trim().length === 0) {
          continue;
        }
        mapped[key] = [...(mapped[key] ?? []), item.message];
      }
      if (Object.keys(mapped).length > 0) {
        return mapped;
      }
    }
  }

  return {};
}

function parseGeneralMessage(error: unknown): string {
  return toUserMessage(error);
}

export function applyBackendErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  validFields: readonly string[],
): string {
  const payload = error instanceof ApiError ? error.payload : null;
  const fieldErrors = parseFieldErrors(payload);

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!validFields.includes(field)) {
      continue;
    }

    setError(field as Path<TFieldValues>, {
      type: 'server',
      message: messages[0],
    });
  }

  return parseGeneralMessage(error);
}
