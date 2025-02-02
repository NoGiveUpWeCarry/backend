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
import {
  ApplyToProjectDocs,
  CancelApplicationDocs,
  CheckApplyStatusDocs,
  CheckBookmarkDocs,
  CreateProjectDocs,
  DeleteProjectDocs,
  GetApplicantsDocs,
  GetPopularProjectsThisWeekDocs,
  GetProjectDetailDocs,
  GetProjectsDocs,
  ToggleBookmarkDocs,
  UpdateApplicationStatusDocs,
  UpdateProjectDocs,
  UpdateProjectStatusDocs,
  UploadFeedImageDocs,
} from './docs/project.docs';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  @GetProjectsDocs.ApiOperation
  @GetProjectsDocs.ApiQueryCursor
  @GetProjectsDocs.ApiQueryRole
  @GetProjectsDocs.ApiQueryUnit
  @GetProjectsDocs.ApiQuerySort
  @GetProjectsDocs.ApiResponseSuccess
  async getProjects(
    @Query('cursor') cursor?: number,
    @Query('role') role?: string,
    @Query('unit') unit?: string,
    @Query('sort') sort: boolean = true
  ) {
    const limit = 10;
    return this.projectService.getProjects({ cursor, limit, role, unit, sort });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CreateProjectDocs.ApiOperation
  @CreateProjectDocs.ApiBody
  @CreateProjectDocs.ApiResponseSuccess
  async createProject(@Body() createProjectDto: CreateProjectDto, @Req() req) {
    const userId = req.user.user_id;
    return this.projectService.createProject(createProjectDto, userId);
  }

  @Put(':projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UpdateProjectDocs.ApiOperation
  @UpdateProjectDocs.ApiParam
  @UpdateProjectDocs.ApiBody
  @UpdateProjectDocs.ApiResponse
  async updateProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() updateProjectDto: CreateProjectDto,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.updateProject(
      userId,
      projectId,
      updateProjectDto
    );
  }

  @Delete(':projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @DeleteProjectDocs.ApiOperation
  @DeleteProjectDocs.ApiParam
  @DeleteProjectDocs.ApiResponse
  async deleteProject(@Req() req, @Param('projectId') projectId: string) {
    const userId = req.user.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.projectService.deleteProject(userId, numProjectId);
  }

  @Get('popular-this-week')
  @GetPopularProjectsThisWeekDocs.ApiOperation
  @GetPopularProjectsThisWeekDocs.ApiResponse
  async getPopularProjectsThisWeek() {
    return this.projectService.getPopularProjectsThisWeek();
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @UploadFeedImageDocs.ApiOperation
  @UploadFeedImageDocs.ApiConsumes
  @UploadFeedImageDocs.ApiBody
  @UploadFeedImageDocs.ApiResponse
  async func(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.user_id;
    console.log(userId);
    return await this.projectService.uploadFeedImage(userId, file);
  }

  @Get(':projectId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @GetProjectDetailDocs.ApiOperation
  @GetProjectDetailDocs.ApiParam
  @GetProjectDetailDocs.ApiResponse
  async getProjectDetail(@Req() req, @Param('projectId') projectId: string) {
    const userId = req.user.user_id;
    const numProjectId = parseInt(projectId, 10);
    return this.projectService.getProjectDetail(userId, numProjectId);
  }

  @Post(':projectId/apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApplyToProjectDocs.ApiOperation
  @ApplyToProjectDocs.ApiParam
  @ApplyToProjectDocs.ApiResponse
  async applyToProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.applyToProject(userId, projectId);
  }

  @Get(':projectId/applicants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @GetApplicantsDocs.ApiOperation
  @GetApplicantsDocs.ApiParam
  @GetApplicantsDocs.ApiResponse
  async getApplicants(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.projectService.getApplicants(projectId);
  }

  @Get(':projectId/apply-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CheckApplyStatusDocs.ApiOperation
  @CheckApplyStatusDocs.ApiParam
  @CheckApplyStatusDocs.ApiResponse
  async checkApplyStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.checkApplyStatus(userId, projectId);
  }

  @Delete(':projectId/cancel-apply')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CancelApplicationDocs.ApiOperation
  @CancelApplicationDocs.ApiParam
  @CancelApplicationDocs.ApiResponse
  async cancelApplication(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.cancelApplication(userId, projectId);
  }

  @Patch(':projectId/applications/:userId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UpdateApplicationStatusDocs.ApiOperation
  @UpdateApplicationStatusDocs.ApiParamProject
  @UpdateApplicationStatusDocs.ApiParamApplication
  @UpdateApplicationStatusDocs.ApiBody
  @UpdateApplicationStatusDocs.ApiResponse
  async updateApplicationStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('userId', ParseIntPipe) targetUserId: number, // 지원자의 userId를 받음
    @Body('status') status: 'Accepted' | 'Rejected' | 'Pending',
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.updateApplicationStatus(
      userId,
      projectId,
      targetUserId,
      status
    );
  }

  @Patch(':projectId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UpdateProjectStatusDocs.ApiOperation
  @UpdateProjectStatusDocs.ApiParam
  @UpdateProjectStatusDocs.ApiBody
  @UpdateProjectStatusDocs.ApiResponse
  async updateProjectStatus(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body('recruiting') recruiting: boolean,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.updateProjectStatus(
      userId,
      projectId,
      recruiting
    );
  }

  @Post(':projectId/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ToggleBookmarkDocs.ApiOperation
  @ToggleBookmarkDocs.ApiParam
  @ToggleBookmarkDocs.ApiResponse
  async toggleBookmark(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.toggleBookmark(userId, projectId);
  }

  @Get(':projectId/bookmark')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @CheckBookmarkDocs.ApiOperation
  @CheckBookmarkDocs.ApiParam
  @CheckBookmarkDocs.ApiResponse
  async checkBookmark(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Req() req
  ) {
    const userId = req.user.user_id; // 인증된 사용자 ID
    return this.projectService.checkBookmark(userId, projectId);
  }
}
