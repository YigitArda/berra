import { loginSchema } from '../schema';

describe('loginSchema', () => {
  it('rejects invalid payload', () => {
    const parsed = loginSchema.safeParse({ email: 'bad', password: '123' });
    expect(parsed.success).toBe(false);
  });

  it('accepts valid payload', () => {
    const parsed = loginSchema.safeParse({ email: 'user@example.com', password: '123456' });
    expect(parsed.success).toBe(true);
  });
});
