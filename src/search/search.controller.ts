import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { OptionalAuthGuard } from '@src/modules/auth/guards/optional-auth.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // 모달 창에서 검색
  @Get('modal')
  @UseGuards(OptionalAuthGuard)
  async handleModalSearch(
    @Req() req,
    @Query('keyword') keyword: string,
    @Query('category') category: string
  ) {
    return await this.searchService.handleModalSearch(
      req.user,
      keyword,
      category
    );
  }
}
