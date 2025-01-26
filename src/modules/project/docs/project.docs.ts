import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';

export const GetProjectsDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 목록 조회',
    description:
      '프로젝트 목록을 페이징으로 조회합니다. 무한 스크롤을 지원합니다.',
  }),
  ApiQueryCursor: ApiQuery({
    name: 'cursor',
    required: false,
    type: Number,
    description: '마지막 항목의 ID. 무한 스크롤에서 사용.',
    example: 10,
  }),
  ApiQueryRole: ApiQuery({
    name: 'role',
    required: false,
    type: String,
    description: '필터링할 역할 (예: Developer, Designer)',
  }),
  ApiQueryUnit: ApiQuery({
    name: 'unit',
    required: false,
    type: String,
    description: '필터링할 직업 세부 정보',
  }),
  ApiQuerySort: ApiQuery({
    name: 'sort',
    required: false,
    type: Boolean,
    description: '정렬 기준 (true: 최신순, false: 인기순)',
    example: 'true',
  }),
  ApiResponseSuccess: ApiResponse({
    status: 200,
    description: '프로젝트 목록 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '전체 커넥션허브 조회에 성공했습니다',
        },
        projects: [
          {
            projectId: 1,
            title: 'Project 1',
            content: 'Content of project 1',
            thumbnailUrl: 'https://example.com/thumbnail1.jpg',
            role: 'Developer',
            skills: ['JavaScript', 'React'],
            detailRoles: ['Frontend Developer'],
            hubType: 'Remote',
            startDate: '2023-01-01',
            duration: '3 months',
            workType: 'Full-time',
            applyCount: 5,
            bookMarkCount: 10,
            viewCount: 50,
            status: 'OPEN',
            createdAt: '2023-01-01T00:00:00Z',
            user: {
              userId: 1,
              nickname: 'testUser',
              name: 'Test User',
              profileUrl: 'https://example.com/profile.jpg',
              role: 'Developer',
            },
          },
        ],
        pagination: {
          lastCursor: 1,
        },
      },
    },
  }),
};

export const CreateProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 생성',
    description: '새로운 프로젝트를 생성합니다.',
  }),
  ApiBody: ApiBody({
    description: '프로젝트 생성 요청 데이터',
    schema: {
      example: {
        title: '프로젝트 제목',
        content: '프로젝트 내용',
        role: 'Programmer',
        hub_type: 'PROJECT',
        start_date: '2025-01-01',
        duration: '6 months',
        work_type: 'ONLINE',
        recruiting: true,
        skills: ['React', 'TypeScript'],
        detail_roles: ['Frontend Developer', 'Fullstack Developer'],
      },
    },
  }),
  ApiResponseSuccess: ApiResponse({
    status: 201,
    description: '프로젝트 생성 성공',
    schema: {
      example: {
        message: {
          code: 201,
          text: '프로젝트 생성에 성공했습니다',
        },
        project: {
          projectId: 1,
          title: '프로젝트 제목',
          content: '프로젝트 내용',
          thumbnailUrl: 'thumbNail Photo url',
          role: 'Programmer',
          hubType: 'PROJECT',
          startDate: '2025-01-01',
          duration: '6 months',
          workType: 'ONLINE',
          status: 'OPEN',
          viewCount: 0,
          applyCount: 0,
          bookmarkCount: 0,
          createdAt: '2023-01-01T00:00:00Z',
          skills: ['React', 'TypeScript'],
          detailRoles: ['Frontend Developer', 'Fullstack Developer'],
        },
      },
    },
  }),
};

export const UpdateProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 수정',
    description: '특정 프로젝트의 내용을 수정합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '수정하려는 프로젝트의 ID',
    type: Number,
  }),
  ApiBody: ApiBody({
    description: '수정할 프로젝트 데이터',
    schema: {
      example: {
        title: '수정된 프로젝트 제목',
        content: '수정된 프로젝트 내용',
        role: 'Programmer',
        hub_type: 'PROJECT',
        start_date: '2025-01-01',
        duration: '6 months',
        work_type: 'ONLINE',
        recruiting: true,
        skills: ['React', 'TypeScript'],
        detail_roles: ['Frontend Developer', 'Fullstack Developer'],
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 수정 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '프로젝트가 성공적으로 수정되었습니다.',
        },
        project: {
          projectId: 1,
          title: '수정된 프로젝트 제목',
          content: '수정된 프로젝트 내용',
          role: 'Programmer',
          hubType: 'PROJECT',
          thumbnailUrl: 'thumbnail URL',
          startDate: '2025-01-23',
          duration: '6 months',
          workType: 'ONLINE',
          skills: ['React', 'TypeScript'],
          detailRoles: ['Frontend Developer', 'Fullstack Developer'],
        },
      },
    },
  }),
};

export const DeleteProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 삭제',
    description: '특정 프로젝트를 삭제합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '삭제하려는 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 삭제 성공',
    schema: {
      example: {
        message: { code: 200, text: '프로젝트가 삭제되었습니다.' },
      },
    },
  }),
};

export const GetPopularProjectsThisWeekDocs = {
  ApiOperation: ApiOperation({
    summary: '인기 프로젝트 조회 (이번 주)',
    description: '이번 주 가장 인기 있는 프로젝트를 조회합니다.',
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '인기 프로젝트 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '인기 프로젝트 조회에 성공했습니다',
        },
        popularProjects: [
          {
            projectId: 1,
            title: '프로젝트 제목',
            user: {
              userId: 1,
              name: 'Lee Chan',
              nickname: 'leechan_dev',
              profileUrl: 'https://example.com/profile.png',
              role: 'Developer',
            },
            hubType: 'PROJECT',
          },
          {
            projectId: 2,
            title: '프로젝트 제목 2',
            user: {
              userId: 2,
              name: 'Kim Min',
              nickname: 'min_kim',
              profileUrl: 'https://example.com/profile2.png',
              role: 'Designer',
            },
            hubType: 'OUTSOURCING',
          },
        ],
      },
    },
  }),
};

export const UploadFeedImageDocs = {
  ApiOperation: ApiOperation({
    summary: '이미지 업로드',
    description: '프로젝트 관련 이미지를 업로드합니다.',
  }),
  ApiConsumes: ApiConsumes('multipart/form-data'),
  ApiBody: ApiBody({
    description: '이미지 파일 업로드',
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
    description: '이미지 업로드 성공',
    schema: {
      example: {
        imageUrl: 'https://example.com/uploads/image.png',
        message: {
          code: 200,
          text: '이미지 업로드가 완료되었습니다.',
        },
      },
    },
  }),
};

export const GetProjectDetailDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 상세 조회',
    description: '특정 프로젝트의 상세 정보를 조회합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '조회하려는 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 상세 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '프로젝트 상세 조회에 성공했습니다',
        },
        project: {
          projectId: 1,
          title: '프로젝트 제목',
          content: '프로젝트 상세 내용',
          role: 'Programmer',
          hubType: 'PROJECT',
          startDate: '2025-01-01T00:00:00Z',
          duration: '6 months',
          workType: 'ONLINE',
          status: 'OPEN',
          skills: ['React', 'TypeScript'],
          detailRoles: ['Frontend Developer', 'Backend Developer'],
          viewCount: 2,
          createdAt: '2025-01-01T00:00:00Z',
          manager: {
            userId: 101,
            name: 'Lee Chan',
            nickname: 'leechan_dev',
            role: 'Programmer',
            profileUrl: 'https://example.com/profile.png',
            introduce: '프론트엔드 개발자입니다.',
          },
        },
        isOwnConnectionHub: true,
      },
    },
  }),
};

export const ApplyToProjectDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 지원',
    description: '특정 프로젝트에 사용자가 지원합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '지원할 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 지원 성공',
    schema: {
      example: {
        message: {
          text: '프로젝트에 지원되었습니다.',
          code: 200,
        },
        isApply: true,
      },
    },
  }),
};

export const GetApplicantsDocs = {
  ApiOperation: ApiOperation({
    summary: '지원자 목록 조회',
    description: '특정 프로젝트의 지원자 목록을 조회합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '지원자를 조회할 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '지원자 목록 조회 성공',
    schema: {
      example: {
        applicants: [
          {
            userId: 1,
            name: 'Lee Chan',
            nickname: 'leechan_dev',
            profileUrl: 'https://example.com/profile.png',
          },
        ],
        message: {
          code: 200,
          text: '프로젝트 지원자 목록 조회에 성공했습니다',
        },
      },
    },
  }),
};

export const CheckApplyStatusDocs = {
  ApiOperation: ApiOperation({
    summary: '지원 상태 확인',
    description: '사용자가 특정 프로젝트에 지원했는지 확인합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '지원 상태를 확인할 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '지원 상태 확인 성공',
    schema: {
      example: {
        applied: true,
        message: '해당 프로젝트에 이미 지원했습니다.',
      },
    },
  }),
};

export const CancelApplicationDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 지원 취소',
    description: '사용자가 특정 프로젝트에 대한 지원을 취소합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '지원 취소할 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 지원 취소 성공',
    schema: {
      example: {
        message: '프로젝트 지원이 취소되었습니다.',
      },
    },
  }),
};

export const UpdateApplicationStatusDocs = {
  ApiOperation: ApiOperation({
    summary: '지원 상태 변경',
    description: '프로젝트 작성자가 특정 지원자의 지원 상태를 변경합니다.',
  }),
  ApiParamProject: ApiParam({
    name: 'projectId',
    description: '변경할 지원 상태가 속한 프로젝트 ID',
    type: Number,
  }),
  ApiParamApplication: ApiParam({
    name: 'userId',
    description: '지원자의 userId',
    type: Number,
  }),
  ApiBody: ApiBody({
    description: '지원 상태 변경 요청 데이터 (Accepted, Rejected, Pending)',
    schema: {
      example: {
        status: 'Accepted', // 또는 'Rejected', 'Pending'
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '지원 상태 변경 성공',
    schema: {
      example: {
        message: '지원 상태가 변경되었습니다.',
        application: {
          applicationId: 10,
          status: 'Accepted',
        },
      },
    },
  }),
};

export const UpdateProjectStatusDocs = {
  ApiOperation: ApiOperation({
    summary: '프로젝트 상태 변경',
    description: '프로젝트 작성자가 프로젝트 상태를 변경합니다 (OPEN / CLOSE).',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '상태를 변경할 프로젝트 ID',
    type: Number,
  }),
  ApiBody: ApiBody({
    description: '프로젝트 상태 변경 요청 데이터 true: OPEN, false: CLOSE',
    schema: {
      example: {
        recruiting: true,
      },
    },
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '프로젝트 상태 변경 성공',
    schema: {
      example: {
        message: '프로젝트 상태가 변경되었습니다.',
        project: {
          projectId: 1,
          recruiting: true,
          status: 'OPEN',
        },
      },
    },
  }),
};

export const ToggleBookmarkDocs = {
  ApiOperation: ApiOperation({
    summary: '북마크 추가/삭제',
    description: '특정 프로젝트에 북마크를 추가하거나 삭제합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '북마크를 추가하거나 삭제할 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description:
      '북마크 상태 변경 성공 or 실패 bookmarked: true => 북마크 추가됨 false => 북마크 삭제됨',
    schema: {
      example: {
        message: {
          code: 200,
          text: '북마크가 추가되었습니다.', // 또는 '북마크가 삭제되었습니다.'
        },
        bookmarked: true, // true: 북마크 추가됨, false: 북마크 삭제됨
      },
    },
  }),
};

export const CheckBookmarkDocs = {
  ApiOperation: ApiOperation({
    summary: '북마크 여부 확인',
    description: '특정 프로젝트에 북마크가 되어 있는지 여부를 확인합니다.',
  }),
  ApiParam: ApiParam({
    name: 'projectId',
    description: '북마크 여부를 확인할 프로젝트의 ID',
    type: Number,
  }),
  ApiResponse: ApiResponse({
    status: 200,
    description: '북마크 여부 확인 성공 or 실패',
    schema: {
      example: {
        message: {
          code: 200,
          text: '북마크 여부 확인 성공.',
        },
        bookmarked: true, // 또는 false
      },
    },
  }),
};
