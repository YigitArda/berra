import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormField } from '../form-field';
import { Input } from '../input';

describe('FormField', () => {
  it('wires label, describedby and invalid state automatically', () => {
    render(
      <FormField id="email" label="Email" helperText="Kurumsal email" errorText="Geçersiz email">
        <Input />
      </FormField>,
    );

    const input = screen.getByRole('textbox', { name: 'Email' });

    expect(input).toHaveAttribute('id', 'email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-hint email-error');
    expect(screen.getByText('Kurumsal email')).toHaveAttribute('id', 'email-hint');
    expect(screen.getByText('Geçersiz email')).toHaveAttribute('id', 'email-error');
  });
});
