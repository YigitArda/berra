import React from 'react';
import { render, screen } from '@testing-library/react';
import { Input } from '../input';

describe('Input', () => {
  it('sets aria-invalid and error styles when error prop is true', () => {
    render(<Input aria-label="Email" error />);

    const input = screen.getByRole('textbox', { name: 'Email' });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-red-500');
  });

  it('supports variant and size props', () => {
    render(<Input aria-label="Name" variant="success" size="lg" />);

    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveClass('border-emerald-500');
    expect(input).toHaveClass('px-4');
  });
});
