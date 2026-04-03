import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: FastifyRequest & { user: { id: number } }) {
    return this.profileService.me(req.user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Req() req: FastifyRequest & { user: { id: number } }, @Body() body: UpdateProfileDto) {
    return this.profileService.updateMe(req.user.id, body.bio);
  }

  @Get(':username')
  byUsername(@Param('username') username: string) {
    return this.profileService.byUsername(username);
  }
}
