export const STANDARD_RETRY_LABEL = 'Tekrar dene';
export const NETWORK_OFFLINE_MESSAGE = 'İnternet bağlantınızı kontrol edip tekrar deneyin.';

export function resolveFeedbackErrorMessage(error: unknown, fallback = 'Bir hata oluştu.'): string {
  const message = error instanceof Error ? error.message : '';

  if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('networkerror')) {
    return NETWORK_OFFLINE_MESSAGE;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return NETWORK_OFFLINE_MESSAGE;
  }

  return message || fallback;
}
