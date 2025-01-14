import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserProfile(loggedInUserId: number, targetUserId: number) {
    // 사용자 정보를 가져옴
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          role: true, // 역할 정보 (아티스트/프로그래머/디자이너)
          ArtistData: true, // 아티스트 관련 데이터
          ProgrammerData: true, // 프로그래머 관련 데이터
          Resume: true, // 이력서 정보
        },
      });

      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      // 직업군에 따른 맞춤 정보 생성
      let specificData = null;
      if (user.role.name === 'Artist') {
        specificData = {
          soundcloudUrl: user.ArtistData?.soundcloud_url,
          portfolioUrl: user.ArtistData?.portfolio_url,
        };
      } else if (user.role.name === 'Programmer') {
        specificData = {
          githubUsername: user.ProgrammerData?.github_username,
          githubUrl: user.ProgrammerData?.github_url,
          commitCount: user.ProgrammerData?.commit_count,
          contributionData: user.ProgrammerData?.contribution_data,
        };
      }

      // 로그인한 사용자와 조회 대상 사용자가 같은지 확인
      const isOwnProfile = loggedInUserId === targetUserId;

      // 사용자 정보 반환
      return {
        id: user.id,
        email: user.email, // 본인만 이메일 확인 가능
        nickname: user.nickname,
        profileUrl: user.profile_url,
        role: user.role.name,
        introduce: user.introduce,
        applyCount: user.apply_count,
        postCount: user.post_count,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        specificData, // 직업군에 따른 데이터
        isOwnProfile, // 자신의 프로필 여부
      };
    } catch (err) {
      console.error(err);
    }
  }
}
