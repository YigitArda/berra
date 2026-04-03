import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../page';
import { apiFetch } from '../../../lib/api';

const replaceMock = vi.fn();
const refreshMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: replaceMock, refresh: refreshMock }),
  useSearchParams: () => ({ get: () => '/feed' }),
}));

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

describe('LoginPage integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('submits login form and redirects to next path', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockResolvedValue({ message: 'ok' });

    renderWithClient(<LoginPage />);

    await user.type(screen.getByPlaceholderText('ornek@berra.app'), 'user@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'user@example.com',
          password: 'password123',
        }),
      });
    });

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/feed');
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});
