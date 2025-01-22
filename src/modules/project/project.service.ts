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

  async getWeeklyTopProjects() {
    // 이번 주 시작과 끝 날짜 계산
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // 주의 첫 번째 날(일요일)
    const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6)); // 주의 마지막 날(토요일)

    // 상위 5개 프로젝트 조회
    const topProjects = await this.prisma.projectPost.findMany({
      where: {
        Applications: {
          some: {
            created_at: {
              gte: startOfWeek,
              lte: endOfWeek,
            },
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profile_url: true,
          },
        },
        Applications: true,
      },
      orderBy: {
        Applications: {
          _count: 'desc',
        },
      },
      take: 5, // 상위 5개만 가져오기
    });

    // 데이터 가공
    return topProjects.map(project => ({
      id: project.id,
      title: project.title,
      author: {
        userId: project.user.id,
        nickname: project.user.nickname,
        profileUrl: project.user.profile_url,
      },
      applications_count: project.Applications.length,
    }));
  }
}
