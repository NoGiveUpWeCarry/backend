import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { CreateProjectDto } from './dto/CreateProject.dto';
import { startOfWeek, endOfWeek } from 'date-fns';
import { S3Service } from '@src/s3/s3.service';
import * as cheerio from 'cheerio';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service
  ) {}

  async getProjects(params: {
    cursor?: number;
    limit: number;
    role?: string;
    unit?: string;
    sort: boolean;
  }) {
    const { cursor, limit, role, unit, sort } = params;

    const where: any = {};
    if (role) where.role = role;
    if (unit) where.Tags = { some: { tag: { name: unit } } };

    // 커서 조건 추가
    if (cursor) {
      const validCursor = await this.prisma.projectPost.findUnique({
        where: { id: cursor },
      });

      if (!validCursor) {
        throw new BadRequestException('유효하지 않은 커서 값입니다.');
      }

      // 정렬 조건에 따라 커서 조건 추가
      if (sort) {
        where.created_at = { lt: validCursor.created_at }; // created_at 기준
      } else {
        where.saved_count = { lt: validCursor.saved_count }; // saved_count 기준
      }
    }

    const orderBy: any[] = [];
    orderBy.push(sort ? { created_at: 'desc' } : { saved_count: 'desc' });

    const projects = await this.prisma.projectPost.findMany({
      take: limit,
      where,
      orderBy,
      include: {
        Tags: { select: { tag: { select: { name: true } } } },
        Applications: { select: { id: true } },
        Details: { select: { detail_role: { select: { name: true } } } },
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profile_url: true,
            introduce: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    const formattedProjects = projects.map(project => ({
      projectId: project.id,
      title: project.title,
      content: project.content,
      thumbnailUrl: project.thumbnail_url,
      role: project.role,
      skills: project.Tags.map(tag => `${tag.tag.name}`),
      detailRoles: project.Details.map(d => `${d.detail_role.name}`),
      hubType: project.hub_type,
      startDate: project.start_date.toISOString().split('T')[0],
      duration: project.duration,
      workType: project.work_type,
      applyCount: project.Applications.length,
      bookMarkCount: project.saved_count,
      viewCount: project.view,
      status: project.recruiting ? 'OPEN' : 'CLOSED',
      createdAt: project.created_at,
      user: {
        userId: project.user.id,
        nickname: project.user.nickname,
        name: project.user.name,
        profileUrl: project.user.profile_url,
        role: project.user.role.name,
      },
    }));

    const lastCursor = projects[projects.length - 1]?.id || null;

    return {
      message: {
        code: 200,
        text:
          projects.length > 0
            ? '프로젝트 조회에 성공했습니다.'
            : '더 이상 프로젝트가 없습니다.',
      },
      projects: formattedProjects,
      pagination: {
        lastCursor,
      },
    };
  }

  async createProject(createProjectDto: CreateProjectDto, userId: number) {
    const {
      title,
      content,
      role,
      hub_type,
      start_date,
      duration,
      work_type,
      recruiting,
      skills,
      detail_roles,
    } = createProjectDto;

    const thumbnailUrl = await this.getThumbnailUrl(content);
    // 프로젝트 생성
    const project = await this.prisma.projectPost.create({
      data: {
        title,
        content,
        role,
        hub_type,
        start_date: new Date(start_date),
        duration,
        work_type,
        recruiting,
        thumbnail_url: thumbnailUrl,
        user_id: userId, // userId를 사용하여 사용자 식별
      },
    });

    // 태그 저장 (skills)
    const tags = [];
    for (const skill of skills) {
      const tag = await this.prisma.projectTag.upsert({
        where: { name: skill },
        create: { name: skill },
        update: {},
      });

      await this.prisma.projectPostTag.create({
        data: {
          post_id: project.id,
          tag_id: tag.id,
        },
      });

      tags.push(tag.name); // 생성된 태그 추가
    }

    const roleMapping: Record<string, number> = {
      Programmer: 1,
      Artist: 2,
      Designer: 3,
    };

    // 매핑된 role_id 가져오기
    const saveRoleId = roleMapping[role];

    // 모집단위 저장 (detail_roles)
    const roles = [];
    for (const detail_role of detail_roles) {
      const role = await this.prisma.detailRole.upsert({
        where: { name: detail_role },
        create: { name: detail_role, role_id: saveRoleId },
        update: {},
      });

      await this.prisma.projectDetailRole.create({
        data: {
          post_id: project.id,
          detail_role_id: role.id,
        },
      });

      roles.push(role.name); // 생성된 모집단위 추가
    }

    // 결과 반환
    return {
      message: {
        code: 201,
        text: '프로젝트 생성에 성공했습니다',
      },
      project: {
        projectId: project.id,
        title: project.title,
        content: project.content,
        thumbnailUrl: project.thumbnail_url,
        role: project.role,
        hubType: project.hub_type,
        startDate: project.start_date,
        duration: project.duration,
        workType: project.work_type,
        status: project.recruiting ? 'OPEN' : 'CLOSED',
        viewCount: project.view,
        applyCount: 0,
        bookmarkCount: 0,
        createdAt: project.created_at,
        skills: tags,
        detailRoles: roles,
      },
    };
  }

  async getPopularProjectsThisWeek() {
    const today = new Date();
    const startDate = startOfWeek(today, { weekStartsOn: 1 }); // 월요일 시작
    const endDate = endOfWeek(today, { weekStartsOn: 1 }); // 일요일 종료

    // 이번 주 북마크가 많은 프로젝트를 조회
    const popularProjects = await this.prisma.projectPost.findMany({
      where: {
        Saves: {
          some: {
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profile_url: true,
            role: true,
          },
        },
      },
      orderBy: {
        saved_count: 'desc', // 북마크 수 기준 정렬
      },
      take: 5, // 상위 5개
    });

    const results = popularProjects.map(project => ({
      projectId: project.id,
      title: project.title,
      user: {
        userId: project.user.id,
        name: project.user.name,
        nickname: project.user.nickname,
        profileUrl: project.user.profile_url,
        role: project.user.role.name,
      },
      hubType: project.hub_type,
    }));
    // 반환 데이터 가공
    return {
      message: {
        code: 200,
        text: '인기 프로젝트 조회에 성공했습니다',
      },
      popularProjects: results,
    };
  }

  async uploadFeedImage(userId: number, file: Express.Multer.File) {
    const fileType = file.mimetype.split('/')[1];
    const imageUrl = await this.s3.uploadImage(
      8,
      file.buffer,
      fileType,
      'pad_projects/image'
    );

    return {
      imageUrl,
      message: { code: 200, text: '이미지 업로드가 완료되었습니다.' },
    };
  }

  // 썸네일 추출
  async getThumbnailUrl(text: string) {
    try {
      const $ = cheerio.load(text);
      const thumnailUrl = $('img').first().attr('src');
      return thumnailUrl;
    } catch (err) {
      throw err;
    }
  }

  async getProjectDetail(userId: number, numProjectId: number) {
    // 조회수 증가
    await this.prisma.projectPost.update({
      where: { id: numProjectId },
      data: {
        view: {
          increment: 1, // view 값을 1 증가
        },
      },
    });

    // 프로젝트 상세 정보 조회
    const project = await this.prisma.projectPost.findUnique({
      where: { id: numProjectId },
      include: {
        Tags: {
          select: {
            tag: {
              select: { name: true },
            },
          },
        },
        Details: {
          select: {
            detail_role: {
              select: { name: true },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profile_url: true,
            introduce: true,
            role: true,
          },
        },
        Applications: {
          select: { id: true }, // 지원 데이터를 가져옴
        },
      },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 사용자가 작성자인지 여부 확인
    const isOwnConnectionHub = project.user.id === userId;

    // 데이터 반환
    return {
      message: {
        code: 200,
        text: '프로젝트 상세 조회에 성공했습니다',
      },
      project: {
        projectId: project.id,
        title: project.title,
        content: project.content,
        role: project.role,
        hubType: project.hub_type,
        startDate: project.start_date,
        duration: project.duration,
        workType: project.work_type,
        status: project.recruiting ? 'OPEN' : 'CLOSED',
        skills: project.Tags.map(t => t.tag.name),
        detailRoles: project.Details.map(d => d.detail_role.name),
        viewCount: project.view, // 이미 증가된 view 값을 사용
        bookmarkCount: project.saved_count,
        applyCount: project.Applications.length,
        createdAt: project.created_at,
        manager: {
          userId: project.user.id,
          name: project.user.name,
          nickname: project.user.nickname,
          role: project.user.role.name,
          profileUrl: project.user.profile_url,
          introduce: project.user.introduce ? project.user.introduce : null,
        },
      },
      isOwnConnectionHub,
    };
  }

  async applyToProject(userId: number, projectId: number) {
    // 프로젝트 존재 여부 확인
    const project = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 이미 지원했는지 확인
    const existingApplication = await this.prisma.userApplyProject.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: projectId },
      },
    });

    if (existingApplication) {
      throw new ConflictException('이미 지원한 프로젝트입니다.');
    }

    // 지원 생성
    await this.prisma.userApplyProject.create({
      data: {
        user_id: userId,
        post_id: projectId,
      },
    });

    return {
      message: {
        text: '프로젝트에 지원되었습니다.',
        code: 200,
      },
      isApply: true,
    };
  }

  async getApplicants(projectId: number) {
    // 프로젝트 존재 여부 확인
    const project = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 지원자 목록 조회
    const applicants = await this.prisma.userApplyProject.findMany({
      where: { post_id: projectId },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true,
            profile_url: true,
            introduce: true,
          },
        },
        status: true,
      },
    });
    const resultapplicants = applicants.map(applicant => ({
      userId: applicant.user.id,
      name: applicant.user.name,
      nickname: applicant.user.nickname,
      profileUrl: applicant.user.profile_url,
      status: applicant.status,
    }));
    return {
      applicants: resultapplicants,
      message: {
        code: 200,
        text: '프로젝트 지원자 목록 조회에 성공했습니다',
      },
    };
  }

  async updateProject(
    userId: number,
    projectId: number,
    updateProjectDto: CreateProjectDto
  ) {
    const {
      title,
      content,
      role,
      hub_type,
      start_date,
      duration,
      work_type,
      recruiting,
      skills,
      detail_roles,
    } = updateProjectDto;

    // 권한 확인
    const auth = await this.feedAuth(userId, projectId);
    if (!auth) {
      throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
    }

    // 썸네일 URL 업데이트
    const thumbnailUrl = await this.getThumbnailUrl(content);

    // 프로젝트 업데이트
    await this.prisma.projectPost.update({
      where: { id: projectId },
      data: {
        title,
        content,
        role,
        hub_type,
        start_date: new Date(start_date),
        duration,
        work_type,
        recruiting,
        thumbnail_url: thumbnailUrl,
      },
    });

    // 모집단위 업데이트
    const roleMapping: Record<string, number> = {
      Programmer: 1,
      Artist: 2,
      Designer: 3,
    };

    const saveRoleId = roleMapping[role];

    await this.prisma.$transaction(async prisma => {
      // 기존 태그 삭제
      await prisma.projectPostTag.deleteMany({
        where: { post_id: projectId },
      });

      // 새 태그 추가
      for (const skill of skills) {
        const tag = await prisma.projectTag.upsert({
          where: { name: skill },
          create: { name: skill },
          update: {},
        });

        await prisma.projectPostTag.create({
          data: {
            post_id: projectId,
            tag_id: tag.id,
          },
        });
      }

      // 기존 모집단위 삭제
      await prisma.projectDetailRole.deleteMany({
        where: { post_id: projectId },
      });

      // 새 모집단위 추가
      for (const detail_role of detail_roles) {
        const role = await prisma.detailRole.upsert({
          where: { name: detail_role },
          create: { name: detail_role, role_id: saveRoleId },
          update: {},
        });

        await prisma.projectDetailRole.create({
          data: {
            post_id: projectId,
            detail_role_id: role.id,
          },
        });
      }
    });

    // 결과 반환
    const updatedProject = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
      include: {
        Tags: {
          select: {
            tag: { select: { name: true } },
          },
        },
        Details: {
          select: {
            detail_role: { select: { name: true } },
          },
        },
      },
    });

    if (!updatedProject) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return {
      message: { code: 200, text: '프로젝트가 성공적으로 수정되었습니다.' },
      project: {
        projectId: updatedProject.id,
        title: updatedProject.title,
        content: updatedProject.content,
        role: updatedProject.role,
        hubType: updatedProject.hub_type,
        thumbnailUrl: updatedProject.thumbnail_url,
        startDate: updatedProject.start_date,
        duration: updatedProject.duration,
        workType: updatedProject.work_type,
        skills: updatedProject.Tags.map(t => t.tag.name),
        detailRoles: updatedProject.Details.map(d => d.detail_role.name),
      },
    };
  }

  // 게시글 권한 확인
  async feedAuth(userId: number, projectId: number): Promise<boolean> {
    const auth = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
      select: { user_id: true },
    });
    return auth.user_id === userId;
  }

  async checkApplyStatus(userId: number, projectId: number) {
    const application = await this.prisma.userApplyProject.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: projectId },
      },
      select: {
        created_at: true,
      },
    });

    if (!application) {
      return { status: 'not_applied' };
    }

    return {
      status: 'applied',
      applied_at: application.created_at,
    };
  }

  async cancelApplication(userId: number, projectId: number) {
    const application = await this.prisma.userApplyProject.findUnique({
      where: {
        user_id_post_id: { user_id: userId, post_id: projectId },
      },
    });

    if (!application) {
      throw new NotFoundException('해당 프로젝트에 지원한 기록이 없습니다.');
    }

    await this.prisma.userApplyProject.delete({
      where: {
        user_id_post_id: { user_id: userId, post_id: projectId },
      },
    });

    return {
      message: {
        code: 200,
        text: '프로젝트 지원이 취소되었습니다.',
      },
    };
  }

  async updateApplicationStatus(
    userId: number,
    projectId: number,
    targetUserId: number, // 지원자의 userId를 기반으로 업데이트
    status: 'Accepted' | 'Rejected' | 'Pending'
  ) {
    // 프로젝트 작성자인지 확인
    const project = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
      select: { user_id: true },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    if (project.user_id !== userId) {
      throw new ForbiddenException('해당 프로젝트의 작성자가 아닙니다.');
    }

    // 지원 정보 가져오기
    const application = await this.prisma.userApplyProject.findUnique({
      where: {
        user_id_post_id: { user_id: targetUserId, post_id: projectId },
      },
    });

    if (!application) {
      throw new NotFoundException(
        '해당 사용자가 프로젝트에 지원한 기록이 없습니다.'
      );
    }

    // 지원 상태 업데이트
    const updatedApplication = await this.prisma.userApplyProject.update({
      where: { id: application.id },
      data: { status },
    });

    return {
      message: '지원 상태가 변경되었습니다.',
      application: {
        applicationId: updatedApplication.id,
        status: updatedApplication.status,
      },
    };
  }

  async updateProjectStatus(
    userId: number,
    projectId: number,
    recruiting: boolean
  ) {
    // 프로젝트 작성자인지 확인
    const project = await this.prisma.projectPost.findUnique({
      where: { id: projectId },
      select: { user_id: true },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    if (project.user_id !== userId) {
      throw new ForbiddenException('해당 프로젝트의 작성자가 아닙니다.');
    }

    // 프로젝트 상태 업데이트
    const updatedProject = await this.prisma.projectPost.update({
      where: { id: projectId },
      data: { recruiting },
    });

    return {
      message: '프로젝트 상태가 변경되었습니다.',
      project: {
        projectId: updatedProject.id,
        recruiting: updatedProject.recruiting,
        status: recruiting ? 'OPEN' : 'CLOSED',
      },
    };
  }

  async deleteProject(userId: number, projectId: number) {
    const auth = await this.feedAuth(userId, projectId);
    if (!auth) {
      throw new HttpException('권한이 없습니다.', HttpStatus.FORBIDDEN);
    }
    await this.prisma.$transaction([
      this.prisma.projectDetailRole.deleteMany({
        where: { post_id: projectId },
      }),

      this.prisma.projectPostTag.deleteMany({
        where: { post_id: projectId },
      }),

      this.prisma.projectSave.deleteMany({
        where: { post_id: projectId },
      }),

      this.prisma.projectPost.delete({
        where: { id: projectId },
      }),
    ]);

    return { message: { code: 200, text: '프로젝트가 삭제되었습니다.' } };
  }

  async toggleBookmark(userId: number, projectId: number) {
    // 북마크 존재 여부 확인
    const existingBookmark = await this.prisma.projectSave.findFirst({
      where: { user_id: userId, post_id: projectId },
    });

    if (existingBookmark) {
      // 북마크 삭제
      await this.prisma.projectSave.delete({
        where: { id: existingBookmark.id },
      });

      // saved_count 감소
      await this.prisma.projectPost.update({
        where: { id: projectId },
        data: {
          saved_count: {
            decrement: 1, // saved_count 감소
          },
        },
      });

      return {
        message: {
          code: 200,
          text: '북마크가 삭제되었습니다.',
        },
        bookmarked: false,
      };
    }

    // 북마크 추가
    await this.prisma.projectSave.create({
      data: {
        user_id: userId,
        post_id: projectId,
      },
    });

    // saved_count 증가
    await this.prisma.projectPost.update({
      where: { id: projectId },
      data: {
        saved_count: {
          increment: 1, // saved_count 증가
        },
      },
    });

    return {
      message: {
        code: 200,
        text: '북마크가 추가되었습니다.',
      },
      bookmarked: true,
    };
  }

  async checkBookmark(userId: number, projectId: number) {
    // 북마크 여부 확인
    const bookmark = await this.prisma.projectSave.findFirst({
      where: { user_id: userId, post_id: projectId },
    });

    return {
      message: {
        code: 200,
        text: '북마크 여부 확인 성공.',
      },
      bookmarked: !!bookmark,
    };
  }
}
