import { ApiError } from './api';

const DEFAULT_MESSAGE = 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';

export function toUserMessage(error: unknown, fallbackMessage = DEFAULT_MESSAGE): string {
  if (error instanceof ApiError) {
    if (error.message.trim().length > 0) {
      return error.message;
    }

    if (error.status === 401) {
      return 'Oturumunuz geçersiz. Lütfen tekrar giriş yapın.';
    }

    if (error.status === 403) {
      return 'Bu işlem için yetkiniz bulunmuyor.';
    }

    if (error.status >= 500) {
      return 'Sunucu tarafında bir sorun oluştu. Lütfen daha sonra tekrar deneyin.';
    }

    return `İstek başarısız (${error.status}).`;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error;
  }

  return fallbackMessage;
}
