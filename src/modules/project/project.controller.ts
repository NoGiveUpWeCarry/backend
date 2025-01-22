import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ProjectService } from '@modules/project/project.service';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getProjects(
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 10
  ) {
    return this.projectService.getProjects(skip, limit);
  }
}
