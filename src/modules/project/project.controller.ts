import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ProjectService } from '@modules/project/project.service';
import { CreateProjectDto } from './dto/CreateProject.dto';
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getProjects(
    @Query('skip') skip: number = 0,
    @Query('limit') limit: number = 10,
    @Query('role') role?: string,
    @Query('unit') unit?: string,
    @Query('sort') sort: string = 'latest'
  ) {
    return this.projectService.getProjects({ skip, limit, role, unit, sort });
  }

  @Post()
  async createProject(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    const userId = req.user.user_id;
    return this.projectService.createProject(createProjectDto, userId);
  }
}
