import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // 모달 창에서 검색
  @Get('modal')
  async handleModalSearch(
    @Query('keyword') keyword: string,
    @Query('category') category: string
  ) {
    return await this.searchService.handleModalSearch(keyword, category);
  }
}
