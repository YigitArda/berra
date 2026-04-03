import { render, screen } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('sets aria-invalid and error styles when error prop is true', () => {
    render(<Input aria-label="Email" error />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-red-500');
  });
});
