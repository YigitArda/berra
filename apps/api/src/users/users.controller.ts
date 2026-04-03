import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: FastifyRequest & { user: { id: number } }) {
    return this.usersService.me(req.user.id);
  }

  @Get(':username')
  byUsername(@Param('username') username: string) {
    return this.usersService.byUsername(username);
  }
}
