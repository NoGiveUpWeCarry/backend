import { ApiOperation, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';

export const GetProjectsDocs = {
  ApiOperation: ApiOperation({
    summary: '전체 프로젝트 조회',
    description:
      '서비스에 존재하는 모든 프로젝트를 조회합니다. 다양한 쿼리 옵션을 제공합니다.',
  }),
  ApiQuerySkip: ApiQuery({
    name: 'skip',
    required: false,
    description: '건너뛸 데이터 수 (기본값: 0)',
    type: Number,
  }),
  ApiQueryLimit: ApiQuery({
    name: 'limit',
    required: false,
    description: '가져올 데이터 수 (기본값: 10)',
    type: Number,
  }),
  ApiQueryRole: ApiQuery({
    name: 'role',
    required: false,
    description: '필터링할 역할 (예: Programmer)',
    type: String,
  }),
  ApiQueryUnit: ApiQuery({
    name: 'unit',
    required: false,
    description: '모집 단위 (예: React)',
    type: String,
  }),
  ApiQuerySort: ApiQuery({
    name: 'sort',
    required: false,
    description: '정렬 기준 (latest 또는 popular)',
    type: String,
  }),
  ApiResponseSuccess: ApiResponse({
    status: 200,
    description: '프로젝트 조회 성공',
    schema: {
      example: {
        message: {
          code: 200,
          text: '전체 커넥션허브 조회에 성공했습니다',
        },
        projects: [
          {
            projectId: 1,
            title: '프로젝트 제목',
            content: '프로젝트 내용',
            thumbnailUrl: 'https://example.com/thumbnail.png',
            role: 'Programmer',
            tags: ['#React', '#TypeScript'],
            hubType: 'Project',
            startDate: '2025-01-01',
            duration: '3 months',
            workType: 'Online',
            applyCount: 5,
            bookMarkCount: 3,
            viewCount: 10,
            status: 'OPEN',
            user: {
              userId: 101,
              nickname: 'leechan_dev',
              name: 'Lee Chan',
              profileUrl: 'https://example.com/profile.png',
              role: 'Developer',
            },
          },
        ],
        page: 1,
        limit: 10,
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
        hub_type: 'Project',
        start_date: '2025-01-01',
        duration: '6 months',
        work_type: 'Online',
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
          role: 'Programmer',
          hubType: 'Project',
          startDate: '2025-01-01',
          duration: '6 months',
          workType: 'Online',
          status: 'OPEN',
          tags: ['React', 'TypeScript'],
          detailRoles: ['Frontend Developer', 'Fullstack Developer'],
        },
      },
    },
  }),
};
