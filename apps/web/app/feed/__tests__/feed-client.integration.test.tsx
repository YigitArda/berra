import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedClient } from '../feed-client';
import { apiFetch } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiFetch: vi.fn(),
}));

vi.mock('../../../hooks/use-require-auth', () => ({
  useRequireAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    session: { user: { id: 1 } },
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

describe('FeedClient integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads feed and creates a new post', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch)
      .mockResolvedValueOnce({
        posts: [
          {
            id: 10,
            username: 'berra',
            body: 'Mevcut içerik',
            like_count: 2,
            comment_count: 1,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({
        posts: [
          {
            id: 11,
            username: 'berra',
            body: 'Yeni içerik',
            like_count: 0,
            comment_count: 0,
            created_at: '2026-01-01T00:00:00.000Z',
          },
        ],
      });

    renderWithClient(<FeedClient />);

    expect(await screen.findByText('Mevcut içerik')).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Ne düşünüyorsun?'), 'Yeni içerik');
    await user.click(screen.getByRole('button', { name: 'Paylaş' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/feed', {
        method: 'POST',
        body: JSON.stringify({ body: 'Yeni içerik' }),
      });
    });

    expect(await screen.findByText('Yeni içerik')).toBeInTheDocument();
  });
});
