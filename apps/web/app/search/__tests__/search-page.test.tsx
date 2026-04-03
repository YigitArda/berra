import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPage from '../page';
import { apiFetch } from '../../../lib/api';

vi.mock('../../../lib/api', () => ({
  apiFetch: vi.fn(),
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

describe('SearchPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls API and renders results after submit', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockResolvedValue({
      items: [{ id: 5, body: 'Sonuç metni' }],
    });

    renderWithClient(<SearchPage />);

    await user.type(screen.getByPlaceholderText('Arama terimi...'), 'test query');
    await user.click(screen.getByRole('button', { name: 'Ara' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/search?q=test%20query&page=1');
    });

    expect(await screen.findByText('#5')).toBeInTheDocument();
    expect(screen.getByText('Sonuç metni')).toBeInTheDocument();
  });

  it('shows empty state when search has no result', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockResolvedValue({ items: [] });

    renderWithClient(<SearchPage />);

    await user.type(screen.getByPlaceholderText('Arama terimi...'), 'empty');
    await user.click(screen.getByRole('button', { name: 'Ara' }));

    expect(await screen.findByText('Sonuç bulunamadı.')).toBeInTheDocument();
  });
});
