import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';

export const GetUserFollowersDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자를 팔로우하는 사용자 목록 조회',
    description: '특정 사용자를 팔로우하는 사용자들의 목록을 반환합니다.',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '팔로워 목록 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로워 목록 조회에 성공했습니다',
        },
        followerUsers: [
          {
            id: 1,
            nickname: 'Alice',
            profileUrl: 'https://example.com/profiles/alice.jpg',
          },
        ],
      },
    },
  }),
};

export const GetUserFollowingsDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자가 팔로우한 사용자 목록 조회',
    description: '특정 사용자가 팔로우한 사용자들의 목록을 반환합니다.',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '팔로잉 목록 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '팔로잉 목록 조회에 성공했습니다',
        },
        followingUsers: [
          {
            id: 3,
            nickname: 'Charlie',
            profileUrl: 'https://example.com/profiles/charlie.jpg',
          },
        ],
      },
    },
  }),
};

export const GetUserProfileDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 프로필 정보 조회',
    description: '특정 사용자의 프로필 정보를 반환합니다.',
  }),
  ApiParam: ApiParam({
    name: 'userId',
    required: true,
    description: '조회할 사용자의 ID',
    type: 'string',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '사용자 프로필 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '유저 프로필 조회에 성공했습니다',
        },
        status: '둘러보는 중',
        githubUsername: 'JohnGit',
        works: [
          {
            title: 'My Project',
            myPageProjectId: 1,
            projectProfileUrl: 'projectProfileUrl',
            description: 'Project description here.',
            links: [
              {
                type: 'Github',
                url: 'https://github.com/johndoe/myproject',
              },
            ],
          },
          {
            title: 'My Project2',
            myPageProjectId: 2,
            projectProfileUrl: 'projectProfileUrl2',
            description: 'Project description here2.',
            links: [
              {
                type: 'Github',
                url: 'https://github.com/johndoe/myproject2',
              },
            ],
          },
        ],
        followerCount: 12,
        followingCount: 34,
        applyCount: 12,
        postCount: 17,
        isOwnProfile: true,
      },
    },
  }),
};

export const GetUserProfileHeaderDocs = {
  ApiOperation: ApiOperation({
    summary: '유저 프로필 헤더 조회',
    description: '닉네임을 기반으로 특정 유저의 프로필 헤더를 조회합니다.',
  }),
  ApiParam: ApiParam({
    name: 'nickname',
    required: true,
    description: '조회할 유저의 닉네임',
    example: 'testNickname',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로필 헤더 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '유저 프로필(헤더 부분) 조회에 성공했습니다',
        },
        userId: 1,
        nickname: 'testNickname',
        profileUrl: 'https://example.com/profile.jpg',
        role: 'Developer',
        introduce: '안녕하세요. 저는 개발자입니다.',
        userLinks: ['https://github.com/test', 'https://test.com'],
        isOwnProfile: false,
        isFollowing: true,
      },
    },
  }),
};

export const AddProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 추가',
    description:
      '사용자의 마이페이지에 새 프로젝트를 추가합니다. 프로젝트 이미지 업로드가 가능합니다.',
  }),
  ApiConsumes: ApiConsumes('multipart/form-data'),
  ApiBody: ApiBody({
    description:
      '추가할 프로젝트 데이터. `typeId` : 1 = Github, 2 = Web, 3 = IOS, 4 = Android',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '프로젝트 프로필 이미지 파일',
        },
        title: {
          type: 'string',
          description: '프로젝트 제목',
        },
        description: {
          type: 'string',
          description: '프로젝트 설명',
        },
        links: {
          type: 'string',
          description: '프로젝트 링크 배열 (JSON 문자열)',
          example: JSON.stringify([
            { url: 'https://github.com/myproject', typeId: 1 },
            { url: 'https://myproject.com', typeId: 2 },
          ]),
        },
      },
      required: ['title', 'description', 'links'],
    },
  }),
  ApiResponse: ApiResponse({
    status: 201,
    description: '프로젝트 추가 성공',
    schema: {
      example: {
        message: {
          code: 201,
          text: '마이페이지에 프로젝트 추가에 성공했습니다',
        },
        myPageProjectId: 1,
        title: 'My Project',
        description: 'This is a description of my project.',
        projectProfileUrl: 'https://s3.example.com/path/to/image.png',
        links: [
          { url: 'https://github.com/myproject', type: 'Github' },
          { url: 'https://myproject.com', type: 'Web' },
        ],
      },
    },
  }),
};

export const UpdateProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 수정',
    description:
      '사용자의 특정 프로젝트를 수정합니다. 프로젝트 이미지도 수정 가능합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    required: true,
    description: '수정할 프로젝트의 ID',
    type: 'string',
  }),
  ApiConsumes: ApiConsumes('multipart/form-data'),
  ApiBody: ApiBody({
    description: '수정할 프로젝트 데이터',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '새로운 프로젝트 프로필 이미지 파일',
        },
        title: {
          type: 'string',
          description: '수정된 프로젝트 제목',
        },
        description: {
          type: 'string',
          description: '수정된 프로젝트 설명',
        },
        links: {
          type: 'string',
          description: '수정된 프로젝트 링크 배열 (JSON 문자열)',
          example: JSON.stringify([
            { url: 'https://github.com/updatedproject', typeId: 1 },
            { url: 'https://updatedproject.com', typeId: 2 },
          ]),
        },
      },
      required: ['title', 'description', 'links'],
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 수정 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '마이페이지에 프로젝트 수정에 성공했습니다',
        },
        myPageProjectId: 1,
        title: 'Updated Project',
        description: 'This is an updated description.',
        projectProfileUrl: 'https://s3.example.com/path/to/updated_image.png',
        links: [
          { url: 'https://github.com/updatedproject', type: 'Github' },
          { url: 'https://updatedproject.com', type: 'Website' },
        ],
      },
    },
  }),
};

export const DeleteProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 삭제',
    description: '사용자의 특정 프로젝트를 삭제합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    required: true,
    description: '삭제할 프로젝트의 ID',
    type: 'string',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '프로젝트 삭제에 성공했습니다',
        },
        projectId: 1,
      },
    },
  }),
};

export const AddWorkDocs = {
  ApiOperation: ApiOperation({
    summary: '아티스트 작업물 추가',
    description: '아티스트의 새 작업물(musicUrl)을 추가합니다.',
  }),
  ApiBody: ApiBody({
    description: '추가할 작업물의 musicUrl',
    schema: {
      example: {
        musicUrl: 'https://www.youtube.com/watch?v=example',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 201,
    description: '작업물 추가 성공',
    schema: {
      example: {
        message: {
          code: 201,
          text: '작업물이 성공적으로 추가되었습니다.',
        },
        musicId: 1,
        musicUrl: 'https://www.youtube.com/watch?v=example',
      },
    },
  }),
};

export const UpdateWorkDocs = {
  ApiOperation: ApiOperation({
    summary: '아티스트 작업물 수정',
    description: '특정 작업물의 musicUrl을 수정합니다.',
  }),
  ApiParam: ApiParam({
    name: 'workId',
    required: true,
    description: '수정할 작업물의 ID',
    type: 'string',
  }),
  ApiBody: ApiBody({
    description: '수정할 작업물의 musicUrl',
    schema: {
      example: {
        musicUrl: 'https://www.youtube.com/watch?v=updated_example',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '작업물 수정 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '작업물이 성공적으로 수정되었습니다.',
        },
        musicId: 1,
        musicUrl: 'https://www.youtube.com/watch?v=updated_example',
      },
    },
  }),
};

export const DeleteWorkDocs = {
  ApiOperation: ApiOperation({
    summary: '아티스트 작업물 삭제',
    description: '특정 작업물을 삭제합니다.',
  }),
  ApiParam: ApiParam({
    name: 'workId',
    required: true,
    description: '삭제할 작업물의 ID',
    type: 'string',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '작업물 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '작업물이 성공적으로 삭제되었습니다.',
        },
        musicId: 1,
      },
    },
  }),
};

export const UpdateGithubUsernameDocs = {
  ApiOperation: ApiOperation({
    summary: 'GitHub 닉네임 업데이트',
    description: '사용자의 GitHub 닉네임을 업데이트합니다.',
  }),
  ApiBody: ApiBody({
    description: '업데이트할 GitHub 닉네임',
    schema: {
      example: {
        githubUsername: 'NewGithubUsername',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: 'GitHub 닉네임 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '깃허브 유저네임 등록에 성공했습니다.',
        },
        githubUsername: 'SSomae',
      },
    },
  }),
};

export const GetUserSettingDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 설정 정보 조회',
    description: '사용자의 설정 정보를 조회합니다.',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '유저 정보 세팅페이지 정보 조회에 성공했습니다',
    schema: {
      example: {
        message: {
          code: 200,
          text: '유저 정보 세팅페이지 정보 조회에 성공했습니다.',
        },
        nickname: 'UserNickname',
        profileUrl: 'UserProfileURL',
        introduce: 'User Introduce',
        status: '구인 중',
        links: [
          { linkId: 1, url: 'https://github.com/Ss0Mae' },
          { linkId: 2, url: 'https://www.google.com' },
        ],
        skills: ['TypeScript', 'Nest.js'],
        jobDetail: 'IT / 백엔드개발자',
        notification: {
          pushAlert: false,
          followingAlert: false,
          projectAlert: false,
        },
      },
    },
  }),
};

export const PatchUserNicknameDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 닉네임 업데이트',
    description: '사용자의 닉네임을 업데이트합니다.',
  }),
  ApiBody: ApiBody({
    description: '업데이트할 닉네임',
    schema: {
      example: {
        nickname: 'NewNickname',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '닉네임 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '닉네임이 성공적으로 업데이트되었습니다.',
        },
        nickname: 'NewNickName',
      },
    },
  }),
};

export const PatchUserIntroduceDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 자기소개 업데이트',
    description: '사용자의 자기소개 내용을 업데이트합니다.',
  }),
  ApiBody: ApiBody({
    description: '업데이트할 자기소개 내용',
    schema: {
      example: {
        introduce: '안녕하세요. 저는 백엔드 개발자입니다.',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '자기소개 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자의 소개가 성공적으로 업데이트되었습니다.',
        },
        introduce: '안녕하세요. 저는 백엔드 개발자입니다.',
      },
    },
  }),
};

export const PatchUserStatusDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 상태 업데이트',
    description: '사용자의 현재 상태를 업데이트합니다. (예: 활동 중, 휴식 중)',
  }),
  ApiBody: ApiBody({
    description:
      '업데이트할 상태 ID 1 = 둘러보는중 2 = 외주 / 프로젝트 구하는 중 3 = 구인하는 중 4 = 작업 중',
    schema: {
      example: {
        statusId: 1, // 예: 1=활동 중, 2=휴식 중
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '상태 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자의 상태가 성공적으로 업데이트되었습니다.',
        },
        status: '활동 중',
      },
    },
  }),
};

export const UpdateUserJobDetailDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 직업 세부정보 업데이트',
    description: '사용자의 직업 카테고리 및 세부정보를 업데이트합니다.',
  }),
  ApiBody: ApiBody({
    description: '업데이트할 직업 카테고리 및 직무 상세',
    schema: {
      example: {
        category: '개발자',
        jobDetail: '백엔드 엔지니어',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '직업 세부정보 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '직무 정보가 성공적으로 업데이트되었습니다.',
        },
        jobDetail: '개발자 / 백엔드 엔지니어',
      },
    },
  }),
};

export const PatchUserSkillsDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 기술 추가',
    description: '사용자의 기술 스택에 새로운 기술을 추가합니다.',
  }),
  ApiBody: ApiBody({
    description: '추가할 기술 목록',
    schema: {
      example: {
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '기술 추가 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '기술 스택이 성공적으로 추가되었습니다.',
        },
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
      },
    },
  }),
};

export const DeleteUserSkillsDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 기술 삭제',
    description: '사용자의 기술 스택에서 특정 기술들을 삭제합니다.',
  }),
  ApiBody: ApiBody({
    description: '삭제할 기술 목록',
    schema: {
      example: {
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '기술 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '기술 스택이 성공적으로 삭제되었습니다.',
        },
        skills: ['JavaScript', 'TypeScript', 'Node.js'],
      },
    },
  }),
};

export const PatchProfileImageDocs = {
  ApiOperation: ApiOperation({
    summary: '프로필 이미지 업데이트',
    description: '사용자의 프로필 이미지를 업데이트합니다.',
  }),
  ApiConsumes: ApiConsumes('multipart/form-data'),
  ApiBody: ApiBody({
    description: '업데이트할 이미지 파일',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로필 이미지 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '프로필 이미지가 성공적으로 업데이트되었습니다.',
        },
        user: {
          userId: 1,
          nickname: 'ssomae',
          profileUrl: 'https://example.com/profiles/ssomae.jpg',
        },
      },
    },
  }),
};

export const PatchUserNotificationDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 알림 설정 업데이트',
    description:
      '사용자의 알림 설정(push, following, project)을 업데이트합니다.',
  }),
  ApiBody: ApiBody({
    description: '업데이트할 알림 설정',
    schema: {
      example: {
        notification: {
          pushAlert: true,
          followingAlert: false,
          projectAlert: true,
        },
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '알림 설정 업데이트 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '알림 설정이 성공적으로 업데이트되었습니다.',
        },
        notifications: {
          pushAlert: true,
          followingAlert: false,
          projectAlert: true,
        },
      },
    },
  }),
};

export const AddUserLinksDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 링크 추가',
    description: '사용자의 프로필에 새로운 링크를 추가합니다.',
  }),
  ApiBody: ApiBody({
    description: '추가할 링크 목록',
    schema: {
      example: {
        url: 'https://github.com/user'
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 201,
    description: '링크 추가 성공',
    schema: {
      example: {
        message: {
          code: 201,
          text: '링크가 성공적으로 추가되었습니다.',
        },
        links: [
          { linkId: 1, url: 'https://github.com/user' },
          { linkId: 2, url: 'https://linkedin.com/in/user' },
        ],
      },
    },
  }),
};

export const DeleteUserLinksDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 링크 삭제',
    description: '사용자의 프로필에서 특정 링크를 삭제합니다.',
  }),
  ApiBody: ApiBody({
    description: '삭제할 링크 ID 목록',
    schema: {
      example: {
        linkId: 1,
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '링크 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '링크가 성공적으로 삭제되었습니다.',
        },
        links: [
          { linkId: 3, url: 'https://twitter.com/user' },
          { linkId: 4, url: 'https://facebook.com/user' },
        ],
      },
    },
  }),
};

export const UpdateUserLinksDocs = {
  ApiOperation: ApiOperation({
    summary: '링크 수정',
    description: '사용자의 특정 링크를 수정합니다.',
  }),
  ApiBody: ApiBody({
    description: '수정할 링크의 ID와 새로운 URL 정보',
    schema: {
      type: 'object',
      properties: {
        linkId: {
          type: 'number',
          description: '수정할 링크의 ID',
          example: 1,
        },
        url: {
          type: 'string',
          description: '새로운 링크 URL',
          example: 'https://example.com',
        },
      },
      required: ['linkId', 'url'],
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '링크가 성공적으로 수정되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'object',
          properties: {
            code: { type: 'number', example: 200 },
            text: {
              type: 'string',
              example: '링크가 성공적으로 수정되었습니다.',
            },
          },
        },
        links: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              linkId: { type: 'number', example: 1 },
              url: { type: 'string', example: 'https://example.com' },
            },
          },
        },
      },
    },
  }),
};

export const GetUserResumeDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 이력서 조회',
    description: '특정 사용자의 이력서를 조회합니다.',
  }),
  ApiParam: ApiParam({
    name: 'userId',
    required: true,
    description: '조회할 사용자의 ID',
    type: 'string',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '이력서 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자 이력서 조회에 성공했습니다.',
        },
        userId: 1,
        resumeId: 2,
        title: 'Backend Developer',
        jobDetail: '개발자 / 백엔드 엔지니어',
        skills: ['Node.js', 'TypeScript', 'GraphQL'],
        portfolioUrl: 'https://portfolio.com/user',
        detail: '경력 및 프로젝트 설명',
        isOwnProfile: true,
      },
    },
  }),
};

export const CreateUserResumeDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 이력서 생성',
    description: '새로운 이력서를 생성합니다.',
  }),
  ApiBody: ApiBody({
    description: '생성할 이력서 정보',
    schema: {
      example: {
        title: 'Frontend Developer',
        portfolioUrl: 'https://github.com/user',
        detail: '5년간 프론트엔드 개발 경력.',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 201,
    description: '이력서 생성 성공',
    schema: {
      example: {
        message: {
          code: 201,
          text: '사용자 이력서 생성에 성공했습니다.',
        },
        resume: {
          userId: 1,
          resumeId: 1,
          title: 'Resume Title',
          portfolioUrl: 'portfolioURL',
          detail: 'Resume Detail',
        },
      },
    },
  }),
};

export const UpdateUserResumeDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 이력서 수정',
    description: '기존 이력서를 수정합니다.',
  }),
  ApiParam: ApiParam({
    name: 'resumeId',
    required: true,
    description: '수정할 이력서의 ID',
    type: 'string',
  }),
  ApiBody: ApiBody({
    description: '수정할 이력서 정보',
    schema: {
      example: {
        title: 'Updated Developer Title',
        portfolioUrl: 'https://updated.github.com/user',
        detail: 'Updated details about the resume.',
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '이력서 수정 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자 이력서 수정에 성공했습니다.',
        },
        updatedResume: {
          userId: 1,
          resumeId: 1,
          title: 'Resume Title',
          portfolioUrl: 'portfolioURL',
          detail: 'Resume Detail',
        },
      },
    },
  }),
};

export const DeleteUserResumeDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 이력서 삭제',
    description: '기존 이력서를 삭제합니다.',
  }),
  ApiParam: ApiParam({
    name: 'resumeId',
    required: true,
    description: '삭제할 이력서의 ID',
    type: 'string',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '이력서 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자 이력서 삭제에 성공했습니다.',
        },
        resumeId: 1,
      },
    },
  }),
};

export const GetUserFeedPostsDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 피드 조회',
    description: '특정 사용자가 작성한 피드 목록을 조회합니다.',
  }),
  ApiParam: ApiParam({
    name: 'userId',
    required: true,
    description: '피드를 조회할 사용자의 ID',
    type: 'string',
  }),
  ApiQuery: [
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호 (기본값: 1)',
      type: 'number',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지 당 항목 수 (기본값: 10)',
      type: 'number',
    }),
  ],
  ApiResponse: ApiResponse({
    status: 200,
    description: '사용자 피드 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자 피드 조회에 성공했습니다.',
        },
        feeds: [
          {
            id: 1,
            title: 'My First Feed',
            content: 'This is the content of my feed.',
            thumbnailUrl: 'https://example.com/thumbnail.jpg',
            createdAt: '2023-01-01T00:00:00.000Z',
            view: 100,
            likeCount: 10,
            commentCount: 5,
            user: {
              id: 1,
              nickname: 'JohnDoe',
              profileUrl: 'https://example.com/profile.jpg',
            },
            tags: ['Tag1', 'Tag2'],
          },
        ],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
      },
    },
  }),
};

export const GetUserConnectionHubProjectsDocs = {
  ApiOperation: ApiOperation({
    summary: '사용자 커넥션 허브 조회',
    description: '특정 사용자가 생성하거나 지원한 프로젝트 목록을 조회합니다.',
  }),
  ApiParam: ApiParam({
    name: 'userId',
    required: true,
    description: '프로젝트를 조회할 사용자의 ID',
    type: 'string',
  }),
  ApiQuery: [
    ApiQuery({
      name: 'type',
      required: true,
      description: "프로젝트 유형 ('applied' 또는 'created')",
      enum: ['applied', 'created'],
    }),
    ApiQuery({
      name: 'page',
      required: false,
      description: '페이지 번호 (기본값: 1)',
      type: 'number',
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: '페이지 당 항목 수 (기본값: 10)',
      type: 'number',
    }),
  ],
  ApiResponse: ApiResponse({
    status: 200,
    description: '커넥션 허브 프로젝트 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '사용자 커넥션허브 조회에 성공했습니다.',
        },
        projects: [
          {
            projectPostId: 1,
            title: 'Project 1',
            content: 'Description of project 1',
            thumbnailUrl: 'https://example.com/project-thumbnail.jpg',
            startDate: '2023-01-01',
            duration: '6 months',
            recruiting: true,
            view: 100,
            tags: ['Node.js', 'TypeScript'],
          },
        ],
        totalCount: 1,
        currentPage: 1,
        totalPages: 1,
      },
    },
  }),
};
