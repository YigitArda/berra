import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res({ passthrough: true }) res: FastifyReply) {
    const data = await this.authService.register(body.username, body.email, body.password);
    this.writeAuthCookie(res, data.token);
    return { message: data.message, user: data.user };
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: FastifyReply) {
    const data = await this.authService.login(body.email, body.password);
    this.writeAuthCookie(res, data.token);
    return { message: data.message, user: data.user };
  }


  @Post('refresh')
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.token ?? bearer;

    if (!token) throw new UnauthorizedException('Token bulunamadı.');

    const data = await this.authService.refresh(token);
    this.writeAuthCookie(res, data.token);
    return { message: data.message, user: data.user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: FastifyReply) {
    res.clearCookie('token');
    return { message: 'Çıkış yapıldı.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: FastifyRequest & { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }

  private writeAuthCookie(res: FastifyReply, token: string) {
    res.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
  }
}
