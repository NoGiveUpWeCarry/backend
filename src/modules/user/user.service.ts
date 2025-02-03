import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    // 팔로워 수와 팔로잉 수 계산
    const followerCount = await this.prisma.follows.count({
      where: { followed_user_id: targetUserId },
    });

    const followingCount = await this.prisma.follows.count({
      where: { following_user_id: targetUserId },
    });

    // 유저가 작성한 피드 개수
    const feedCount = await this.prisma.feedPost.count({
      where: { user_id: targetUserId },
    });

    // 유저가 지원한 프로젝트의 개수
    const applyCount = await this.prisma.userApplyProject.count({
      where: { user_id: targetUserId },
    });
    // 반환 데이터 구성
    const response = {
      message: {
        code: 200,
        text: '유저 프로필 조회에 성공했습니다',
      },
      status: user.status.name,
      followerCount, // 팔로워 수
      followingCount, // 팔로잉 수
      feedCount, // 유저가 작성한 피드 개수
      applyCount, // 유저가 지원한 프로젝트 개수
      isOwnProfile: loggedInUserId === targetUserId, // 자신의 프로필인지 확인
    };

    // 사용자 직업군에 따라 데이터를 동적으로 추가
    if (user.role.name === 'Artist') {
      Object.assign(response, {
        works: user.ArtistData.map(work => ({
          musicUrl: work.music_url,
          musicId: work.id,
        })), // 단순 URL 배열로 변환
      });
    } else if (
      user.role.name === 'Programmer' ||
      user.role.name === 'Designer'
    ) {
      Object.assign(response, {
        githubUsername: user.ProgrammerData?.github_username || null,
        works: user.MyPageProject
          ? user.MyPageProject.map(project => ({
              title: project.title,
              description: project.description,
              myPageProjectId: project.id,
              projectProfileUrl: project.projectProfileUrl,
              links: project.ProjectLinks.map(link => ({
                type: link.type.name,
                url: link.url,
              })),
            }))
          : [],
      });
    }

    return response;
  }

  async getUserProfileHeaderByNickname(
    loggedInUserId: number,
    nickname: string
  ) {
    // 닉네임으로 사용자 조회
    const user = await this.prisma.user.findUnique({
      where: { nickname }, // 닉네임을 기준으로 조회
      include: {
        role: true, // 역할 정보
        UserLinks: true, // 연결된 링크
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 로그인한 사용자가 해당 유저를 팔로우하고 있는지 확인
    const isFollowing = await this.prisma.follows.findFirst({
      where: {
        following_user_id: loggedInUserId,
        followed_user_id: user.id,
      },
    });

    // 반환 데이터 구성
    return {
      message: {
        code: 200,
        text: '유저 프로필(헤더 부분) 조회에 성공했습니다',
      },
      userId: user.id,
      nickname: user.nickname,
      profileUrl: user.profile_url,
      role: user.role.name,
      introduce: user.introduce,
      userLinks: user.UserLinks.map(link => link.link), // 단순 URL 배열로 변경
      isOwnProfile: loggedInUserId === user.id, // 자신의 프로필인지 확인
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
    return {
      message: {
        code: 200,
        text: '팔로잉 목록 조회에 성공했습니다',
      },
      followerUsers: followers.map(follower => ({
        userId: follower.following_user.id,
        nickname: follower.following_user.nickname,
        profileUrl: follower.following_user.profile_url,
      })),
    };
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
    return {
      message: {
        code: 200,
        text: '팔로잉 목록 조회에 성공했습니다',
      },
      followingUsers: followings.map(following => ({
        userId: following.followed_user.id,
        nickname: following.followed_user.nickname,
        profileUrl: following.followed_user.profile_url,
      })),
    };
  }

  async addProject(userId: number, projectData: any, imageUrl: string | null) {
    const { title, description, links } = projectData;

    // 작업물 추가
    const newProject = await this.prisma.myPageProject.create({
      data: {
        user_id: userId,
        title,
        description,
        projectProfileUrl: imageUrl,
        ProjectLinks: {
          create: links.map(link => ({
            url: link.url,
            type_id: link.typeId, // LinkType의 ID를 사용
          })),
        },
      },
      include: {
        ProjectLinks: {
          include: { type: true },
        },
      },
    });

    return {
      message: {
        code: 201,
        text: '마이페이지에 프로젝트 추가에 성공했습니다',
      },
      myPageProjectId: newProject.id,
      title: newProject.title,
      description: newProject.description,
      projectProfileUrl: newProject.projectProfileUrl,
      links: newProject.ProjectLinks.map(link => ({
        url: link.url,
        type: link.type.name,
      })),
    };
  }

  async updateProject(
    userId: number,
    projectId: number,
    projectData: any,
    imageUrl: string | null
  ) {
    const { title, description, links } = projectData;

    // 기존 프로젝트 확인
    const existingProject = await this.prisma.myPageProject.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
      include: {
        ProjectLinks: true, // 기존 링크를 가져옴
      },
    });

    if (!existingProject) {
      throw new NotFoundException('작업물을 찾을 수 없습니다.');
    }

    // 파일이 없는 경우 기존의 projectProfileUrl 유지
    const finalImageUrl = imageUrl || existingProject.projectProfileUrl;

    // 링크 업데이트 및 추가
    if (links) {
      for (const link of links) {
        const existingLink = await this.prisma.myPageProjectLink.findFirst({
          where: {
            project_id: projectId,
            type_id: link.typeId,
          },
        });

        if (existingLink) {
          // 기존 링크가 있으면 업데이트
          await this.prisma.myPageProjectLink.update({
            where: { id: existingLink.id },
            data: {
              url: link.url,
            },
          });
        } else {
          // 기존 링크가 없으면 새로 생성
          await this.prisma.myPageProjectLink.create({
            data: {
              project_id: projectId,
              url: link.url,
              type_id: link.typeId,
            },
          });
        }
      }
    }

    // 프로젝트 자체 업데이트
    const updatedProject = await this.prisma.myPageProject.update({
      where: { id: projectId },
      data: {
        title: title || existingProject.title, // title이 없으면 기존 값 유지
        description: description || existingProject.description, // description이 없으면 기존 값 유지
        projectProfileUrl: finalImageUrl, // 이미지 URL 업데이트
      },
      include: {
        ProjectLinks: {
          include: { type: true },
        },
      },
    });

    // 최종적으로 모든 링크를 가져옴
    const allLinks = await this.prisma.myPageProjectLink.findMany({
      where: { project_id: projectId },
      include: { type: true }, // type 필드 포함
    });

    return {
      message: {
        code: 200,
        text: '마이페이지에 프로젝트 수정에 성공했습니다',
      },
      myPageProjectId: updatedProject.id,
      title: updatedProject.title,
      description: updatedProject.description,
      projectProfileUrl: updatedProject.projectProfileUrl,
      links: allLinks.map(link => ({
        url: link.url,
        type: link.type.name,
      })),
    };
  }

  async deleteProject(userId: number, projectId: number) {
    // 1. 프로젝트 존재 여부 확인
    const existingProject = await this.prisma.myPageProject.findFirst({
      where: {
        id: projectId,
        user_id: userId,
      },
    });

    if (!existingProject) {
      throw new NotFoundException('작업물을 찾을 수 없습니다.');
    }

    // 2. 트랜잭션을 사용하여 ProjectLinks와 myPageProject 삭제
    await this.prisma.$transaction([
      this.prisma.myPageProjectLink.deleteMany({
        where: { project_id: projectId },
      }),
      this.prisma.myPageProject.delete({
        where: { id: projectId },
      }),
    ]);

    // 3. 반환 데이터 구성
    return {
      message: {
        code: 200,
        text: '마이페이지에 프로젝트 삭제에 성공했습니다',
      },
      projectId,
    };
  }

  async getUserSetting(userId: number) {
    // 사용자 정보를 가져옵니다.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserLinks: true, // 링크 정보만 포함
        UserSkills: {
          include: {
            skill: true, // Skill 정보를 포함
          },
        },
        status: true, // 상태 정보 포함
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 데이터 반환
    return {
      message: {
        code: 200,
        text: '유저 정보 세팅페이지 정보 조회에 성공했습니다',
      },
      nickname: user.nickname,
      profileUrl: user.profile_url,
      introduce: user.introduce,
      status: user.status?.name,
      links: user.UserLinks.map(link => ({
        linkId: link.id,
        url: link.link, // 링크 정보만 반환
      })),
      skills: user.UserSkills.map(skill => skill.skill.name), // 기술 스택
      jobDetail: user.job_detail,
      notifications: {
        pushAlert: user.push_alert,
        followingAlert: user.following_alert,
        projectAlert: user.project_alert,
      },
    };
  }

  async patchUserNickname(userId: number, nickname: string) {
    if (!nickname || nickname.trim().length === 0) {
      throw new BadRequestException('닉네임은 비어 있을 수 없습니다.');
    }

    // 닉네임 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname,
      },
    });

    return {
      message: {
        code: 200,
        text: '유저 닉네임이 성공적으로 변경되었습니다',
      },
      nickname: updatedUser.nickname,
    };
  }

  async updateUserJobDetail(
    userId: number,
    category: string,
    jobDetail: string
  ) {
    const jobDetailString = `${category} / ${jobDetail}`;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { job_detail: jobDetailString },
    });

    return {
      message: {
        code: 200,
        text: '직무 정보가 성공적으로 업데이트되었습니다.',
      },
      jobDetail: user.job_detail,
    };
  }

  async patchUserIntroduce(userId: number, introduce: string) {
    // 사용자의 한 줄 소개 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { introduce },
    });

    return {
      message: {
        code: 200,
        text: '사용자의 소개가 성공적으로 업데이트되었습니다.',
      },
      introduce: updatedUser.introduce,
    };
  }

  async patchUserStatus(userId: number, statusId: number) {
    // Status ID가 유효한지 확인
    const status = await this.prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      throw new NotFoundException('유효하지 않은 상태 ID입니다.');
    }

    // 사용자의 상태 업데이트
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { status_id: statusId },
    });

    return {
      message: {
        code: 200,
        text: '사용자의 상태가 성공적으로 업데이트되었습니다.',
      },
      status: status.name,
    };
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

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profile_url: imageUrl },
      select: { id: true, nickname: true, profile_url: true },
    });
    return {
      message: {
        code: 200,
        text: '프로필 이미지가 성공적으로 업데이트되었습니다.',
      },
      user: {
        userId: user.id,
        nickname: user.nickname,
        profileUrl: user.profile_url,
      },
    };
  }

  async patchUserNotification(
    userId: number,
    notifications: {
      pushAlert?: boolean;
      followingAlert?: boolean;
      projectAlert?: boolean;
    }
  ) {
    // Validation
    if (
      notifications.pushAlert === undefined &&
      notifications.followingAlert === undefined &&
      notifications.projectAlert === undefined
    ) {
      return {
        message: {
          code: 400,
          text: '업데이트할 알림 설정이 제공되지 않았습니다.',
        },
      };
    }

    const updateData: any = {};

    if (notifications.pushAlert !== undefined) {
      updateData.push_alert = notifications.pushAlert;
    }
    if (notifications.followingAlert !== undefined) {
      updateData.following_alert = notifications.followingAlert;
    }
    if (notifications.projectAlert !== undefined) {
      updateData.project_alert = notifications.projectAlert;
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          push_alert: true,
          following_alert: true,
          project_alert: true,
        },
      });

      return {
        message: {
          code: 200,
          text: '알림 설정이 성공적으로 업데이트되었습니다.',
        },
        notifications: {
          pushAlert: updatedUser.push_alert,
          followingAlert: updatedUser.following_alert,
          projectAlert: updatedUser.project_alert,
        },
      };
    } catch (error) {
      throw new Error(
        `알림 설정 업데이트 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }

  async addUserSkills(userId: number, skills: string[]) {
    // 기존에 없는 스킬만 추가
    const existingSkills = await this.prisma.skill.findMany({
      where: { name: { in: skills } },
    });

    const existingSkillNames = existingSkills.map(skill => skill.name);

    // 새로운 스킬만 추가
    const newSkills = skills.filter(
      skill => !existingSkillNames.includes(skill)
    );

    // 새 스킬 DB에 추가
    const createdSkills = await Promise.all(
      newSkills.map(skill =>
        this.prisma.skill.upsert({
          where: { name: skill },
          update: {},
          create: { name: skill },
        })
      )
    );

    // User와 Skill 관계 연결
    const skillIds = [...existingSkills, ...createdSkills].map(
      skill => skill.id
    );
    await Promise.all(
      skillIds.map(skillId =>
        this.prisma.userSkill.upsert({
          where: { user_id_skill_id: { user_id: userId, skill_id: skillId } },
          update: {},
          create: { user_id: userId, skill_id: skillId },
        })
      )
    );

    return {
      message: {
        code: 200,
        text: '기술 스택이 성공적으로 추가되었습니다',
      },
      skills: skills,
    };
  }

  async deleteUserSkills(userId: number, skills: string[]) {
    // 스킬 ID 가져오기
    const skillRecords = await this.prisma.skill.findMany({
      where: { name: { in: skills } },
    });

    const skillIds = skillRecords.map(skill => skill.id);

    // User와 Skill 관계 삭제
    await this.prisma.userSkill.deleteMany({
      where: {
        user_id: userId,
        skill_id: { in: skillIds },
      },
    });

    return {
      message: {
        code: 200,
        text: '기술 스택이 성공적으로 삭제되었습니다',
      },
      skills,
    };
  }

  async addUserLink(userId: number, url: string) {
    // URL이 이미 존재하는지 확인
    const existingLink = await this.prisma.myPageUserLink.findFirst({
      where: { user_id: userId, link: url },
    });

    if (existingLink) {
      // 이미 존재하는 경우 바로 반환
      const userLinks = await this.prisma.myPageUserLink.findMany({
        where: { user_id: userId },
        select: { id: true, link: true },
      });

      return {
        message: {
          code: 201,
          text: '이미 존재하는 링크입니다.',
        },
        links: userLinks.map(link => ({
          linkId: link.id,
          url: link.link,
        })),
      };
    }

    // 새 링크 추가
    await this.prisma.myPageUserLink.create({
      data: {
        user_id: userId,
        link: url,
      },
    });

    // 유저의 모든 링크 조회
    const updatedLinks = await this.prisma.myPageUserLink.findMany({
      where: { user_id: userId },
      select: { id: true, link: true },
    });

    return {
      message: {
        code: 201,
        text: '링크가 성공적으로 추가되었습니다.',
      },
      links: updatedLinks.map(link => ({
        linkId: link.id,
        url: link.link,
      })),
    };
  }

  async deleteUserLink(userId: number, id: number) {
    const deletedLink = await this.prisma.myPageUserLink.deleteMany({
      where: {
        id,
        user_id: userId,
      },
    });

    if (deletedLink.count === 0) {
      throw new NotFoundException('삭제할 링크를 찾을 수 없습니다.');
    }

    const updatedLinks = await this.prisma.myPageUserLink.findMany({
      where: { user_id: userId },
      select: { id: true, link: true },
    });

    return {
      message: {
        code: 200,
        text: '링크가 성공적으로 삭제되었습니다.',
      },
      links: updatedLinks.map(link => ({
        linkId: link.id,
        url: link.link,
      })),
    };
  }

  async updateUserLink(userId: number, id: number, url: string) {
    // 수정할 링크가 존재하는지 확인
    const existingLink = await this.prisma.myPageUserLink.findFirst({
      where: { id, user_id: userId },
    });

    if (!existingLink) {
      throw new NotFoundException('수정할 링크를 찾을 수 없습니다.');
    }

    // URL 업데이트
    await this.prisma.myPageUserLink.update({
      where: { id },
      data: { link: url },
    });

    // 유저의 모든 링크 조회
    const updatedLinks = await this.prisma.myPageUserLink.findMany({
      where: { user_id: userId },
      select: { id: true, link: true },
    });

    return {
      message: {
        code: 200,
        text: '링크가 성공적으로 수정되었습니다.',
      },
      links: updatedLinks.map(link => ({
        linkId: link.id,
        url: link.link,
      })),
    };
  }

  async deleteAccount(userId: number) {
    // 유저가 존재하지 않을 경우 처리
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 관련 데이터 삭제
    await this.prisma.$transaction([
      // 팔로우 관계 삭제
      this.prisma.follows.deleteMany({
        where: {
          OR: [{ following_user_id: userId }, { followed_user_id: userId }],
        },
      }),

      // MyPageUserLink 삭제
      this.prisma.myPageUserLink.deleteMany({
        where: { user_id: userId },
      }),

      // 저장된 프로젝트(ProjectSave) 삭제
      this.prisma.projectSave.deleteMany({
        where: { user_id: userId },
      }),

      // 사용자가 작성한 프로젝트(ProjectPost)와 관련 데이터 삭제
      this.prisma.projectDetailRole.deleteMany({
        where: {
          post: {
            user_id: userId,
          },
        },
      }),
      this.prisma.projectPostTag.deleteMany({
        where: {
          post: {
            user_id: userId,
          },
        },
      }),
      this.prisma.userApplyProject.deleteMany({
        where: {
          user_id: userId,
        },
      }),
      this.prisma.projectPost.deleteMany({
        where: { user_id: userId },
      }),

      // 사용자가 좋아요한 피드 삭제
      this.prisma.feedLike.deleteMany({
        where: { user_id: userId },
      }),

      // 사용자가 작성한 댓글과 관련된 데이터 삭제
      this.prisma.feedCommentLikes.deleteMany({
        where: {
          FeedComment: {
            user_id: userId,
          },
        },
      }),
      this.prisma.feedComment.deleteMany({
        where: { user_id: userId },
      }),

      // 사용자가 작성한 피드와 관련된 데이터 삭제
      this.prisma.feedPostTag.deleteMany({
        where: {
          post: {
            user_id: userId,
          },
        },
      }),
      this.prisma.feedPost.deleteMany({
        where: { user_id: userId },
      }),

      // 알림(Notification) 삭제
      this.prisma.notification.deleteMany({
        where: {
          OR: [{ userId: userId }, { senderId: userId }],
        },
      }),

      // 채널 참여 데이터 삭제
      this.prisma.channel_users.deleteMany({
        where: { user_id: userId },
      }),

      // 메시지 및 상태 삭제
      this.prisma.last_message_status.deleteMany({
        where: { user_id: userId },
      }),
      this.prisma.message.deleteMany({
        where: { user_id: userId },
      }),

      // 이력서(Resume) 삭제
      this.prisma.resume.deleteMany({
        where: { user_id: userId },
      }),

      // 유저 스킬(UserSkill) 삭제
      this.prisma.userSkill.deleteMany({
        where: { user_id: userId },
      }),

      // 프로그래머/아티스트 데이터 삭제
      this.prisma.programmerData.deleteMany({
        where: { user_id: userId },
      }),
      this.prisma.artistData.deleteMany({
        where: { user_id: userId },
      }),

      // 유저 삭제
      this.prisma.user.delete({
        where: { id: userId },
      }),
    ]);

    return {
      message: {
        code: 200,
        text: '사용자와 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
      },
    };
  }

  async getUserResume(loggedInUserId: number, targetUserId: number) {
    // 지원서와 사용자 정보를 함께 조회
    const resume = await this.prisma.resume.findFirst({
      where: { user_id: targetUserId },
      select: {
        title: true,
        portfolio_url: true,
        detail: true,
        id: true,
        user: {
          select: {
            id: true,
            nickname: true,
            job_detail: true, // 직무 상세
            UserSkills: {
              // 기술 스택
              include: {
                skill: true, // 기술 이름
              },
            },
          },
        },
      },
    });

    if (!resume) {
      throw new NotFoundException('지원서를 찾을 수 없습니다.');
    }

    // 자기 자신의 프로필인지 확인
    const isOwnProfile = loggedInUserId === targetUserId;

    // 반환 데이터 구성
    return {
      message: {
        code: 200,
        text: '사용자 이력서 조회에 성공했습니다.',
      },
      userId: resume.user.id,
      resumeId: resume.id,
      title: resume.title,
      jobDetail: resume.user.job_detail, // 직무 상세
      skills: resume.user.UserSkills.map(userSkill => userSkill.skill.name), // 기술 스택 이름 리스트
      portfolioUrl: resume.portfolio_url,
      detail: resume.detail,
      isOwnProfile, // 본인 프로필 여부
    };
  }

  // 지원서 생성
  async createUserResume(
    userId: number,
    data: { title: string; portfolioUrl?: string; detail: string }
  ) {
    // 유저가 이미 이력서를 가지고 있는지 확인
    const existingResume = await this.prisma.resume.findFirst({
      where: { user_id: userId },
    });

    if (existingResume) {
      // 이미 이력서가 있는 경우 예외를 던짐
      throw new Error('해당 유저는 이미 이력서를 가지고 있습니다.');
    }

    // 이력서 생성
    const newResume = await this.prisma.resume.create({
      data: {
        user_id: userId,
        title: data.title,
        portfolio_url: data.portfolioUrl,
        detail: data.detail,
      },
    });

    return {
      message: {
        code: 201,
        text: '사용자 이력서 작성에 성공했습니다.',
      },
      resume: {
        userId: newResume.user_id,
        resumeId: newResume.id,
        title: newResume.title,
        portfolioUrl: newResume.portfolio_url,
        detail: newResume.detail,
      },
    };
  }

  // 지원서 수정
  async updateUserResume(
    userId: number,
    resumeId: number,
    data: { title?: string; portfolioUrl?: string; detail?: string }
  ) {
    // 해당 지원서가 본인의 것인지 확인
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException('지원서를 찾을 수 없습니다.');
    }

    if (resume.user_id !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    // 업데이트 로직
    const updatedResume = await this.prisma.resume.update({
      where: { id: resumeId },
      data: {
        title: data.title,
        portfolio_url: data.portfolioUrl,
        detail: data.detail,
      },
    });

    return {
      message: {
        code: 200,
        text: '사용자 이력서 수정에 성공했습니다.',
      },
      resume: {
        userId: updatedResume.user_id,
        resumeId: updatedResume.id,
        title: updatedResume.title,
        portfolioUrl: updatedResume.portfolio_url,
        detail: updatedResume.detail,
      },
    };
  }

  // 지원서 삭제
  async deleteUserResume(userId: number, resumeId: number) {
    // 해당 지원서가 본인의 것인지 확인
    const resume = await this.prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new NotFoundException('지원서를 찾을 수 없습니다.');
    }

    if (resume.user_id !== userId) {
      throw new ForbiddenException('권한이 없습니다.');
    }

    // 삭제 로직
    await this.prisma.resume.delete({
      where: { id: resumeId },
    });

    return {
      message: {
        code: 200,
        text: '사용자 이력서 삭제에 성공했습니다.',
      },
      resumeId,
    };
  }

  async getFeeds(userId: number, cursor?: number, limit: number = 10) {
    // 특정 유저의 피드 조회 (cursor 기반 페이징)
    const feeds = await this.prisma.feedPost.findMany({
      where: { user_id: userId }, // 특정 유저의 글만 가져옴
      take: limit, // 가져올 개수
      skip: cursor ? 1 : undefined, // 커서가 있는 경우 첫 번째 항목 제외
      cursor: cursor ? { id: cursor } : undefined, // 커서 적용
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            profile_url: true,
          },
        },
        Tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // 마지막 커서 설정 (다음 요청을 위해)
    const lastCursor = feeds.length > 0 ? feeds[feeds.length - 1].id : null;

    return {
      message: {
        code: 200,
        text:
          feeds.length > 0
            ? '사용자 피드 조회에 성공했습니다.'
            : '더 이상 데이터가 없습니다.',
      },
      feeds: feeds.map(feed => ({
        id: feed.id,
        title: feed.title,
        content: feed.content,
        thumbnailUrl: feed.thumbnail_url,
        createdAt: feed.created_at,
        view: feed.view,
        likeCount: feed.like_count,
        commentCount: feed.comment_count,
        user: {
          id: feed.user.id,
          nickname: feed.user.nickname,
          profileUrl: feed.user.profile_url,
        },
        tags: feed.Tags.map(tag => tag.tag.name),
      })),
      pagination: {
        lastCursor, // 다음 요청을 위한 커서 반환
      },
    };
  }

  async getConnectionHubProjects(
    userId: number,
    type: 'applied' | 'created' = 'created', // 기본값 설정
    cursor?: number, // cursor 추가
    limit: number = 10 // limit 기본값
  ) {
    const safeLimit = limit || 10; // Prisma에 전달할 안전한 limit 값
    let projectsQuery;

    if (type === 'applied') {
      // 지원한 프로젝트
      projectsQuery = this.prisma.userApplyProject.findMany({
        where: { user_id: userId },
        take: safeLimit,
        skip: cursor ? 1 : undefined, // 커서가 있는 경우 첫 번째 항목 제외
        cursor: cursor ? { id: cursor } : undefined, // 커서 설정
        include: {
          post: {
            include: {
              Tags: { select: { tag: { select: { name: true } } } },
              Applications: { select: { id: true } },
              Details: { select: { detail_role: { select: { name: true } } } },
            },
          },
        },
        orderBy: {
          post: { created_at: 'desc' },
        },
      });
    } else if (type === 'created') {
      // 생성한 프로젝트
      projectsQuery = this.prisma.projectPost.findMany({
        where: { user_id: userId },
        take: safeLimit,
        skip: cursor ? 1 : undefined, // 커서가 있는 경우 첫 번째 항목 제외
        cursor: cursor ? { id: cursor } : undefined, // 커서 설정
        include: {
          Tags: { select: { tag: { select: { name: true } } } },
          Applications: { select: { id: true } },
          Details: { select: { detail_role: { select: { name: true } } } },
        },
        orderBy: { created_at: 'desc' },
      });
    } else {
      throw new BadRequestException('유효하지 않은 타입입니다.');
    }

    const projects = await projectsQuery;

    // 데이터 포맷팅
    const formattedProjects = projects.map(project => {
      const projectData = type === 'applied' ? project.post : project;
      return {
        projectPostId: projectData.id,
        title: projectData.title,
        content: projectData.content,
        thumbnailUrl: projectData.thumbnail_url,
        role: projectData.role,
        skills: projectData.Tags.map(tag => `${tag.tag.name}`),
        detailRoles: projectData.Details.map(d => `${d.detail_role.name}`),
        hubType: projectData.hub_type,
        startDate: projectData.start_date.toISOString().split('T')[0],
        duration: projectData.duration,
        workType: projectData.work_type,
        applyCount: projectData.Applications.length,
        bookMarkCount: projectData.saved_count,
        viewCount: projectData.view,
        status: projectData.recruiting ? 'OPEN' : 'CLOSED',
        createdAt: projectData.created_at,
      };
    });

    const lastCursor = projects[projects.length - 1]?.id || null; // 마지막 커서 설정

    return {
      message: {
        code: 200,
        text:
          formattedProjects.length > 0
            ? '프로젝트 조회 성공'
            : '더 이상 데이터가 없습니다.',
      },
      projects: formattedProjects,
      pagination: {
        lastCursor,
      },
    };
  }

  async addArtistWork(userId: number, musicUrl: string) {
    const addMusicUrl = musicUrl;

    if (!addMusicUrl) {
      throw new BadRequestException('음악 URL이 필요합니다.');
    }

    const newWork = await this.prisma.artistData.create({
      data: {
        user_id: userId,
        music_url: addMusicUrl,
      },
    });

    return {
      message: {
        code: 201,
        text: '아티스트 작업물 추가에 성공했습니다.',
      },
      musicId: newWork.id,
      musicUrl: newWork.music_url,
    };
  }

  async updateArtistWork(userId: number, workId: number, musicUrl: string) {
    const newMusicUrl = musicUrl;

    if (!newMusicUrl) {
      throw new BadRequestException('음악 URL이 필요합니다.');
    }

    const existingWork = await this.prisma.artistData.findFirst({
      where: {
        id: workId,
        user_id: userId,
      },
    });

    if (!existingWork) {
      throw new NotFoundException('작업물을 찾을 수 없습니다.');
    }

    const updatedWork = await this.prisma.artistData.update({
      where: { id: workId },
      data: {
        music_url: newMusicUrl,
      },
    });

    return {
      message: {
        code: 200,
        text: '아티스트 작업물 수정에 성공했습니다.',
      },
      musicId: updatedWork.id,
      musicUrl: updatedWork.music_url,
    };
  }

  async deleteArtistWork(userId: number, workId: number) {
    const existingWork = await this.prisma.artistData.findFirst({
      where: {
        id: workId,
        user_id: userId,
      },
    });

    if (!existingWork) {
      throw new NotFoundException('작업물을 찾을 수 없습니다.');
    }

    await this.prisma.artistData.delete({
      where: { id: workId },
    });

    return {
      message: {
        code: 200,
        text: '아티스트 작업물 삭제에 성공했습니다.',
      },
      musicId: workId,
    };
  }

  async updateGithubUsername(userId: number, githubUsername: string) {
    if (!githubUsername) {
      throw new NotFoundException('깃허브 닉네임이 필요합니다.');
    }

    // upsert를 사용하여 데이터 생성 또는 업데이트
    const updatedData = await this.prisma.programmerData.upsert({
      where: { user_id: userId },
      update: {
        github_username: githubUsername, // 이미 존재하는 경우 업데이트
      },
      create: {
        user_id: userId,
        github_username: githubUsername, // 존재하지 않는 경우 새로 생성
      },
    });

    return {
      message: {
        code: 200,
        text: '깃허브 유저네임이 성공적으로 저장되었습니다.',
      },
      githubUsername: updatedData.github_username,
    };
  }
}
