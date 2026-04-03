import { All, Controller, Param, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { CutoverProxyService } from './cutover-proxy.service';

@Controller('forum')
export class ForumProxyController {
  constructor(private readonly cutoverProxyService: CutoverProxyService) {}

  @All()
  base(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.cutoverProxyService.forward(req, reply, 'forum');
  }

  @All(':path*')
  nested(@Req() req: FastifyRequest, @Res() reply: FastifyReply, @Param('path') path: string) {
    return this.cutoverProxyService.forward(req, reply, 'forum', path);
  }
}

@Controller('discovery')
export class DiscoveryProxyController {
  constructor(private readonly cutoverProxyService: CutoverProxyService) {}

  @All()
  base(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.cutoverProxyService.forward(req, reply, 'discovery');
  }

  @All(':path*')
  nested(@Req() req: FastifyRequest, @Res() reply: FastifyReply, @Param('path') path: string) {
    return this.cutoverProxyService.forward(req, reply, 'discovery', path);
  }
}

@Controller('businesses')
export class BusinessesProxyController {
  constructor(private readonly cutoverProxyService: CutoverProxyService) {}

  @All()
  base(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.cutoverProxyService.forward(req, reply, 'businesses');
  }

  @All(':path*')
  nested(@Req() req: FastifyRequest, @Res() reply: FastifyReply, @Param('path') path: string) {
    return this.cutoverProxyService.forward(req, reply, 'businesses', path);
  }
}

@Controller('bookmarks')
export class BookmarksProxyController {
  constructor(private readonly cutoverProxyService: CutoverProxyService) {}

  @All()
  base(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.cutoverProxyService.forward(req, reply, 'bookmarks');
  }

  @All(':path*')
  nested(@Req() req: FastifyRequest, @Res() reply: FastifyReply, @Param('path') path: string) {
    return this.cutoverProxyService.forward(req, reply, 'bookmarks', path);
  }
}

@Controller('reports')
export class ReportsProxyController {
  constructor(private readonly cutoverProxyService: CutoverProxyService) {}

  @All()
  base(@Req() req: FastifyRequest, @Res() reply: FastifyReply) {
    return this.cutoverProxyService.forward(req, reply, 'reports');
  }

  @All(':path*')
  nested(@Req() req: FastifyRequest, @Res() reply: FastifyReply, @Param('path') path: string) {
    return this.cutoverProxyService.forward(req, reply, 'reports', path);
  }
}
