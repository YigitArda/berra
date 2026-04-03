import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsClient } from '../notifications-client';
import { apiFetch } from '../../../lib/api';
import { useAppStore } from '../../../store/app-store';

vi.mock('../../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../../../hooks/use-require-auth', () => ({
  useRequireAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('NotificationsClient integration', () => {
  beforeEach(() => {
    useAppStore.setState({ localBadgeCount: 0, toastMessage: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads notifications and marks all as read', async () => {
    const user = userEvent.setup();

    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        notifications: [
          {
            id: 1,
            type: 'reply',
            message: 'Yeni yorum var',
            link: '/thread/test',
            is_read: false,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
        unread: 1,
        page: 1,
        limit: 20,
      })
      .mockResolvedValueOnce({ ok: true });

    renderWithClient(<NotificationsClient />);

    expect(await screen.findByText('Yeni yorum var')).toBeInTheDocument();
    expect(screen.getByText('Okunmamış: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tümünü okundu işaretle' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/notifications/read-all', {
        method: 'PUT',
      });
    });

    expect(await screen.findByText('Okunmamış: 0')).toBeInTheDocument();
  });
});
