import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  login(email: string, _password: string) {
    return {
      message: 'Auth migration scaffold hazır. Gerçek doğrulama henüz taşınmadı.',
      email,
    };
  }

  register(username: string, email: string, _password: string) {
    return {
      message: 'Auth migration scaffold hazır. Gerçek kayıt henüz taşınmadı.',
      username,
      email,
    };
  }
}
