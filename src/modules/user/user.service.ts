import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { S3Service } from '@src/s3/s3.service';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3Service: S3Service
  ) {}

  async getUserProfile(loggedInUserId: number, targetUserId: number) {
    // 조회 대상 사용자의 프로필 정보 가져오기
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: true, // 역할 정보
        status: true, // 상태 정보
        ArtistData: true, // 아티스트 데이터
        ProgrammerData: true, // 프로그래머 데이터
        UserLinks: true, // 연결된 링크
        MyPageProject: {
          include: {
            ProjectLinks: {
              include: {
                type: true, // LinkType 포함
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 로그인한 사용자가 해당 유저를 팔로우하고 있는지 확인
    const isFollowing = await this.prisma.follows.findFirst({
      where: {
        following_user_id: loggedInUserId,
        followed_user_id: targetUserId,
      },
    });

    // 팔로워 수와 팔로잉 수 계산
    const followerCount = await this.prisma.follows.count({
      where: { followed_user_id: targetUserId },
    });

    const followingCount = await this.prisma.follows.count({
      where: { following_user_id: targetUserId },
    });

    // 사용자 직업군에 따른 맞춤 데이터 생성
    let specificData = null;
    if (user.role.name === 'Artist') {
      specificData = {
        musicUrl: user.ArtistData?.music_url,
        platform: user.ArtistData?.platform,
      };
    } else if (
      user.role.name === 'Programmer' ||
      user.role.name === 'Designer'
    ) {
      specificData = {
        githubUsername: user.ProgrammerData?.github_username,
        myPageProjects: user.MyPageProject
          ? {
              title: user.MyPageProject.title,
              description: user.MyPageProject.description,
              links: user.MyPageProject.ProjectLinks.map(link => ({
                type: link.type.name,
                url: link.url,
              })),
            }
          : null,
      };
    }

    // 반환 데이터 구성
    return {
      id: user.id,
      nickname: user.nickname,
      profileUrl: user.profile_url,
      role: user.role.name,
      introduce: user.introduce,
      status: user.status.name,
      applyCount: user.apply_count,
      postCount: user.post_count,
      followerCount, // 팔로워 수
      followingCount, // 팔로잉 수
      userLinks: user.UserLinks.map(link => ({
        url: link.link,
      })), // 연결된 링크
      specificData, // 직업군 맞춤 데이터
      isOwnProfile: loggedInUserId === targetUserId, // 자신의 프로필인지 확인
      isFollowing: !!isFollowing, // 팔로우 여부 확인
    };
  }

  async getUserFollowers(targetUserId: number) {
    // 특정 사용자를 팔로우하는 사용자 목록 조회
    const followers = await this.prisma.follows.findMany({
      where: {
        followed_user_id: targetUserId, // 타겟 유저를 팔로우하는 사용자
      },
      include: {
        following_user: {
          select: {
            id: true,
            nickname: true,
            profile_url: true, // 프로필 이미지
          },
        },
      },
    });

    // 반환 데이터 생성
    return followers.map(follower => ({
      id: follower.following_user.id,
      nickname: follower.following_user.nickname,
      profileUrl: follower.following_user.profile_url,
    }));
  }

  async getUserFollowings(targetUserId: number) {
    const followings = await this.prisma.follows.findMany({
      where: {
        following_user_id: targetUserId, // 타겟 유저가 팔로우한 사용자
      },
      include: {
        followed_user: {
          select: {
            id: true,
            nickname: true,
            profile_url: true, // 프로필 이미지
          },
        },
      },
    });

    // 반환 데이터 생성
    return followings.map(following => ({
      id: following.followed_user.id,
      nickname: following.followed_user.nickname,
      profileUrl: following.followed_user.profile_url,
    }));
  }

  async patchUserNickname(userId: number, nickname: string) {
    return Promise.resolve(undefined);
  }

  async getUserSetting(userId: number) {
    return Promise.resolve(undefined);
  }

  async patchUserIntroduce(userId: number, introduce: string) {
    return Promise.resolve(undefined);
  }

  async patchUserStatus(userId: number, status_id: number) {
    return Promise.resolve(undefined);
  }

  async patchUserSkills(userId: number, skills: string[]) {
    return Promise.resolve(undefined);
  }

  async patchProfileImage(
    userId: number,
    fileBuffer: Buffer,
    fileType: string
  ) {
    const imageUrl = await this.s3Service.uploadImage(
      userId,
      fileBuffer,
      fileType
    );

    return this.prisma.user.update({
      where: { id: userId },
      data: { profile_url: imageUrl },
      select: { id: true, nickname: true, profile_url: true },
    });
  }

  async deleteUserSkills(userId: number, skills: string[]) {
    return Promise.resolve(undefined);
  }

  async patchUserNotification(userId: number, notification: boolean) {
    return Promise.resolve(undefined);
  }
}
