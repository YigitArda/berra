import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../page';
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

describe('RegisterPage integration', () => {
  it('submits the form and shows error message on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(apiFetch).mockRejectedValue(new Error('Email kullanımda'));

    renderWithClient(<RegisterPage />);

    await user.type(screen.getByPlaceholderText('Kullanıcı adı'), 'testuser');
    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Şifre'), 'password123');
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

    expect(await screen.findByText('Email kullanımda')).toBeInTheDocument();
  });
});
