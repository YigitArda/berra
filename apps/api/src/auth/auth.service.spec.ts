import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('sanitizes username/email on register', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, username: 'test', role: 'user' }] })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const config = {
      getOrThrow: jest.fn().mockReturnValue('super-secret-jwt-key'),
      get: jest.fn().mockReturnValue('15m'),
    };
    const service = new AuthService(db as any, config as unknown as ConfigService);

    await service.register(' <test_user> ', ' TEST@MAIL.COM ', 'password123');

    const insertArgs = db.query.mock.calls[1][1];
    expect(insertArgs[0]).toBe('test_user');
    expect(insertArgs[1]).toBe('test@mail.com');
  });
});
