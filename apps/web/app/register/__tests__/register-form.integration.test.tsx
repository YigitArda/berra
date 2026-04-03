import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';
import { apiFetch } from '../../../lib/api';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
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

describe('RegisterPage integration', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('submits register form and redirects to dashboard', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockResolvedValue({ message: 'ok' });

    renderWithClient(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('berra_user'), 'testuser');
    await user.type(screen.getByPlaceholderText('ornek@berra.app'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Kayıt ol' }));

    await waitFor(() => {
      expect(apiFetch).toHaveBeenCalledWith('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard');
    });
  });
});
