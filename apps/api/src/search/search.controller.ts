import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') q?: string,
    @Query('filters') filters?: string,
    @Query('page') page?: string,
  ) {
    const query = (q || '').trim();
    const parsedPage = Math.max(parseInt(page || '1', 10) || 1, 1);
    return this.searchService.searchThreads(query, filters, parsedPage);
  }
}
