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
  async register(@Body() body: RegisterDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const data = await this.authService.register(body.username, body.email, body.password, ua, ip);
    this.writeAccessCookie(res, data.accessToken);
    this.writeRefreshCookie(res, data.refreshToken);
    return { message: data.message, user: data.user };
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const ip = req.ip;
    const ua = req.headers['user-agent'];
    const data = await this.authService.login(body.email, body.password, ua, ip);
    this.writeAccessCookie(res, data.accessToken);
    this.writeRefreshCookie(res, data.refreshToken);
    return { message: data.message, user: data.user };
  }

  @Post('refresh')
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const raw = req.cookies?.refresh_token;
    if (!raw) throw new UnauthorizedException('Refresh token bulunamadı.');

    const data = await this.authService.refresh(raw);
    this.writeAccessCookie(res, data.accessToken);
    this.writeRefreshCookie(res, data.refreshToken);

    return { message: data.message, user: data.user };
  }

  @Post('logout')
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    await this.authService.logout(req.cookies?.refresh_token);
    res.clearCookie('token');
    res.clearCookie('refresh_token');
    return { message: 'Çıkış yapıldı.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: FastifyRequest & { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }

  private writeAccessCookie(res: FastifyReply, token: string) {
    res.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/',
      maxAge: 60 * 15,
    });
  }

  private writeRefreshCookie(res: FastifyReply, token: string) {
    res.setCookie('refresh_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14,
    });
  }
}
