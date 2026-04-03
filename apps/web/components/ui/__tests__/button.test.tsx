import { render, screen } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders label', () => {
    render(<Button>Kaydet</Button>);
    expect(screen.getByRole('button', { name: 'Kaydet' })).toBeInTheDocument();
  });

  it('supports variant and size props', () => {
    render(
      <Button variant="secondary" size="lg">
        Büyük Buton
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Büyük Buton' });
    expect(button).toHaveClass('bg-slate-700');
    expect(button).toHaveClass('px-5');
  });
});
