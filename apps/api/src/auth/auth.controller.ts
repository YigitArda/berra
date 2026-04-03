import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { ACCESS_COOKIE_MAX_AGE_SECONDS, ACCESS_COOKIE_NAME, REFRESH_COOKIE_MAX_AGE_SECONDS, REFRESH_COOKIE_NAME, cookieOptions } from './auth-cookie';

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
    const raw = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!raw) throw new UnauthorizedException('Refresh token bulunamadı.');

    const data = await this.authService.refresh(raw);
    this.writeAccessCookie(res, data.accessToken);
    this.writeRefreshCookie(res, data.refreshToken);

    return { message: data.message, user: data.user };
  }

  @Post('logout')
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    await this.authService.logout(req.cookies?.[REFRESH_COOKIE_NAME]);
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.clearCookie(ACCESS_COOKIE_NAME, cookieOptions(isProd));
    res.clearCookie(REFRESH_COOKIE_NAME, cookieOptions(isProd));
    return { message: 'Çıkış yapıldı.' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: FastifyRequest & { user: { id: number } }) {
    return this.authService.me(req.user.id);
  }

  private writeAccessCookie(res: FastifyReply, token: string) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.setCookie(ACCESS_COOKIE_NAME, token, cookieOptions(isProd, ACCESS_COOKIE_MAX_AGE_SECONDS));
  }

  private writeRefreshCookie(res: FastifyReply, token: string) {
    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    res.setCookie(REFRESH_COOKIE_NAME, token, cookieOptions(isProd, REFRESH_COOKIE_MAX_AGE_SECONDS));
  }
}
