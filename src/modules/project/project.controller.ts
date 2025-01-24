import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { ProjectService } from '@modules/project/project.service';
import { CreateProjectDto } from './dto/CreateProject.dto';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Put(':projectId')
  async updateProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectDto: CreateProjectDto,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.updateProject(
      userId,
      projectId,
      updateProjectDto
    );
  }

  @Delete(':projectId')
  async deleteProject(@Req() req, @Param('projectId') projectId: string) {
    const userId = req.user.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.projectService.deleteProject(userId, numProjectId);
  }

  @Get('popular-this-week')
  async getPopularProjectsThisWeek() {
    return this.projectService.getPopularProjectsThisWeek();
  }

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async func(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.user_id;
    return await this.projectService.uploadFeedImage(userId, file);
  }

  @Get(':projectId')
  async getProjectDetail(@Req() req, @Param('projectId') projectId: string) {
    const userId = req.user.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.projectService.getProjectDetail(userId, numProjectId);
  }

  @Post(':projectId/apply')
  async applyToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.applyToProject(userId, projectId);
  }

  @Get(':projectId/applicants')
  async getApplicants(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.getApplicants(projectId);
  }

  @Get(':projectId/apply-status')
  async checkApplyStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.checkApplyStatus(userId, projectId);
  }

  @Delete(':projectId/cancel-apply')
  async cancelApplication(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.cancelApplication(userId, projectId);
  }

  @Patch(':projectId/applications/:applicationId/status')
  async updateApplicationStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body('status') status: 'Accepted' | 'Rejected' | 'Pending',
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.updateApplicationStatus(
      userId,
      projectId,
      applicationId,
      status
    );
  }

  @Patch(':projectId/status')
  async updateProjectStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body('recruiting') recruiting: boolean,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.updateProjectStatus(
      userId,
      projectId,
      recruiting
    );
  }

  @Post(':projectId/bookmark')
  async toggleBookmark(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.toggleBookmark(userId, projectId);
  }

  @Get(':projectId/bookmark')
  async checkBookmark(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.id; // 인증된 사용자 ID
    return this.projectService.checkBookmark(userId, projectId);
  }
}
