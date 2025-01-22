import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async getProjects(skip: number, limit: number) {
    const projects = await this.prisma.projectPost.findMany({
      skip,
      take: limit,
      include: {
        Tags: {
          select: {
            tag: {
              select: { name: true }, // 태그 이름만 선택
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
            role: {
              select: {
                name: true,
              },
            },
          },
        },
        work_type: {
          select: { name: true },
        },
        Applications: true,
      },
    });

    const totalCount = await this.prisma.projectPost.count();

    const formattedProjects = projects.map(project => ({
      projectId: project.id,
      title: project.title,
      content: project.content,
      thumbnail_url: project.thumbnail_url,
      recruiting: project.recruiting,
      start_date: project.start_date.toISOString(),
      end_date: project.end_date.toISOString(),
      tags: project.Tags.map(tag => tag.tag.name),
      role: project.role,
      work_type: project.work_type.name,
      views: project.view,
      applyCount: project.Applications.length,
      bookMarkCount: project.saved_count,
      user: {
        id: project.user.id,
        name: project.user.name,
        nickname: project.user.nickname,
        profile_url: project.user.profile_url,
        introduce: project.user.introduce,
        role: project.user.role.name,
      },
    }));

    return {
      message: {
        code: 200,
        text: '커넥션허브 목록 조회에 성공했습니다',
      },
      formattedProjects,
      totalCount: totalCount,
      skip,
      limit,
    };
  }
}
