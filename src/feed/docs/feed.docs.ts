import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';

export const getMainPageDocs = {
  ApiOperation: ApiOperation({
    summary: '메인 페이지 피드 조회',
    description: '작성된 피드 목록을 조회합니다',
  }),
  ApiQuery: ApiQuery({
    name: 'latest',
    required: false,
    example: true,
    description: '최신순 정렬 여부 (기본값: 인기순)',
  }),
  ApiQuery2: ApiQuery({
    name: 'cursor',
    required: false,
    description: '무한 스크롤 커서',
  }),
  ApiQuery3: ApiQuery({
    name: 'tags',
    required: false,
    description: '태그 아이디(태그별 게시글 조회할 때 사용)',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '메인 페이지 피드 목록 조회 성공',
    schema: {
      example: {
        posts: [
          {
            userId: '작성자 아이디',
            userName: '작성자 이름',
            userNickname: '작성자 닉네임',
            userRole: '작성자 role',
            userProfileUrl: '작성자 프로필 사진 주소',
            postId: '게시글 아이디',
            title: '게시글 제목',
            thumbnailUrl: '게시글 썸네일 사진 주소',
            content: '게시글 내용',
            tags: ['게시글 태그1', '게시글 태그2'],
            commentCount: '댓글 수',
            likeCount: '좋아요 수',
            viewCount: '조회 수',
            isLiked: '좋아요 여부',
            createdAt: '작성 시간',
          },
        ],
        message: {
          code: 200,
          message: '전체 피드를 정상적으로 조회했습니다.',
        },
      },
    },
  }),
};

export const getWeeklyBestDocs = {
  ApiOperation: ApiOperation({
    summary: '주간 인기 게시글 조회',
    description:
      '좋아요 순으로 주간 인기 게시글을 조회합니다 좋아요 수가 같을 시 조회 수로 정렬됩니다',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '주간 인기 게시글 조회 성공',
    schema: {
      example: {
        contents: [
          {
            postId: '게시글 아이디',
            title: '게시글 제목',
            userId: '유저 아이디',
            userName: '유저 이름',
            userNickname: '유저 닉네임',
            userProfileUrl: '유저 프로필 url',
            userRole: '유저 roel',
          },
          {
            postId: '게시글 아이디',
            title: '게시글 제목',
            userId: '유저 아이디',
            userName: '유저 이름',
            userNickname: '유저 닉네임',
            userProfileUrl: '유저 프로필 url',
            userRole: '유저 roel',
          },
        ],

        message: {
          code: '200',
          message: '성공적으로 조회되었습니다.',
        },
      },
    },
  }),
};

export const getTagsDoc = {
  ApiOperation: ApiOperation({
    summary: '태그 데이터 조회',
    description: 'DB에 저장되어 있는 태그 데이터를 조회합니다 ',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '피드 데이터 조회 성공',
    schema: {
      example: {
        tags: [
          { id: 1, name: '고민' },
          { id: 2, name: '회고' },
          { id: 3, name: '아이디어' },
          { id: 4, name: '계획' },
          { id: 5, name: '토론' },
          { id: 6, name: '정보공유' },
          { id: 7, name: '추천' },
          { id: 8, name: '질문' },
        ],
        message: {
          code: 200,
          message: '태그가 성공적으로 조회되었습니다.',
        },
      },
    },
  }),
};

export const getFeedDocs = {
  ApiOperation: ApiOperation({
    summary: '피드 개별 조회 (게시글)',
    description: '개별 피드를 조회합니다',
  }),
  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '조회할 피드 아이디',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '개별 피드 조회 성공',
    schema: {
      example: {
        post: {
          userId: '작성자 아이디',
          userName: '작성자 이름',
          userNickname: '작성자 닉네임',
          userRole: '작성자 role',
          userProfileUrl: '작성자 프로필 사진 주소',
          postId: '게시글 아이디',
          title: '게시글 제목',
          thumbnailUrl: '게시글 썸네일 사진 주소',
          content: '게시글 내용',
          tags: ['게시글 태그1', '게시글 태그2'],
          commentCount: '댓글 수',
          likeCount: '좋아요 수',
          viewCount: '조회 수',
          isLiked: '좋아요 여부',
          createdAt: '작성 시간',
        },
        message: {
          code: 200,
          message: '개별 피드를 정상적으로 조회했습니다.',
        },
      },
    },
  }),
};

export const getFeedCommentDocs = {
  ApiOperation: ApiOperation({
    summary: '피드 개별 조회 (댓글)',
    description: '개별 피드의 댓글을 조회합니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '조회할 피드의 아이디',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '댓글 조회 성공',
    schema: {
      example: {
        comments: [
          {
            commentId: '댓글 아이디',
            userId: '댓글 작성자 아이디',
            userName: '작성자 이름',
            userRole: '작성자 role',
            userProfileUrl: '작성자 프로필 사진 주소',
            comment: '댓글 내용',
            createdAt: '작성 시간',
            likeCount: '좋아요 수',
            isLiked: '좋아요 여부',
          },
          {
            commentId: '댓글 아이디',
            userId: '댓글 작성자 아이디',
            userName: '작성자 이름',
            userRole: '작성자 role',
            userProfileUrl: '작성자 프로필 사진 주소',
            comment: '댓글 내용',
            createdAt: '작성 시간',
            likeCount: '좋아요 수',
            isLiked: '좋아요 여부',
          },
        ],
        message: {
          code: 200,
          message: '개별 피드(댓글)를 정상적으로 조회했습니다.',
        },
      },
    },
  }),
};

export const handleFeedLikesDocs = {
  ApiOperation: ApiOperation({
    summary: '피드 좋아요 추가/제거',
    description: '요청 시 좋아요 여부에 따라 좋아요가 추가/제거 됩니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '피드 아이디',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '좋아요 추가/제거 성공',
    schema: {
      examples: [
        {
          message: {
            code: 200,
            message: '좋아요가 취소되었습니다.',
          },
        },
        {
          message: {
            code: 200,
            message: '좋아요가 추가되었습니다.',
          },
        },
      ],
    },
  }),
};

export const createFeedDocs = {
  ApiOperation: ApiOperation({
    summary: '피드 등록',
    description: '피드를 등록합니다',
  }),

  ApiBody: ApiBody({
    description: '등록할 피드 데이터',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '피드 제목',
        },
        tags: {
          type: 'string[]',
          description: '피드 태그 목록',
          example: ['고민', '회고'],
        },
        content: {
          type: 'string',
          description: '피드 내용',
        },
      },
      required: ['title', 'tags', 'content'],
    },
  }),

  ApiResponse: ApiResponse({
    status: 201,
    description: '피드 등록 성공',
    schema: {
      example: {
        message: {
          code: 201,
          message: '피드 작성이 완료되었습니다.',
        },
        post: {
          id: '게시글 아이디',
        },
      },
    },
  }),
};

export const updateFeedDocs = {
  ApiOperation: ApiOperation({
    summary: '피드 수정',
    description: '피드를 수정합니다',
  }),

  ApiBody: ApiBody({
    description: '수정할 피드 데이터',
    schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: '수정 or 기존 피드 제목',
        },
        tags: {
          type: 'string[]',
          description: '수정 or 기존 피드 태그 목록',
          example: ['고민', '회고'],
        },
        content: {
          type: 'string',
          description: '수정 or 기존 피드 내용',
        },
      },
      required: ['title', 'tags', 'content'],
    },
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '피드 수정 완료',
    schema: {
      example: {
        message: {
          code: 200,
          message: '피드 수정이 완료되었습니다.',
        },
      },
    },
  }),
};

export const deleteFeedDocs = {
  ApiOperation: ApiOperation({
    summary: '피드 삭제',
    description: '피드를 삭제합니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '삭제할 피드 아이디',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '피드 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          message: '피드가 삭제되었습니다.',
        },
      },
    },
  }),
};

export const createCommentDocs = {
  ApiOperation: ApiOperation({
    summary: '댓글 등록',
    description: '피드에 댓글을 등록합니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '댓글을 작성할 피드 아이디',
  }),

  ApiBody: ApiBody({
    description: '등록할 댓글 데이터',
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '댓글 내용',
        },
      },
    },
  }),

  ApiResponse: ApiResponse({
    status: 201,
    description: '댓글 등록 성공',
    schema: {
      example: {
        message: {
          code: 201,
          message: '댓글이 등록이 완료되었습니다.',
        },
      },
    },
  }),
};

export const updateCommentDocs = {
  ApiOperation: ApiOperation({
    summary: '댓글 수정',
    description: '기존 댓글을 수정합니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '댓글이 작성된 피드 아이디',
  }),

  ApiParam2: ApiParam({
    name: 'commentId',
    required: true,
    description: '댓글 아이디',
  }),

  ApiBody: ApiBody({
    description: '수정할 댓글 데이터',
    schema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: '수정 댓글 내용',
        },
      },
    },
  }),

  ApiResponse: ApiResponse({
    status: 201,
    description: '댓글 수정 성공',
    schema: {
      example: {
        message: {
          code: 201,
          message: '댓글 수정이 완료되었습니다.',
        },
      },
    },
  }),
};

export const deleteCommentDocs = {
  ApiOperation: ApiOperation({
    summary: '댓글 삭제',
    description: '댓글을 삭제합니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '삭제할 댓글 아이디',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '댓글 삭제 성공',
    schema: {
      example: {
        message: {
          code: 200,
          message: '댓글이 삭제되었습니다.',
        },
      },
    },
  }),
};

export const handleCommentLikesDocs = {
  ApiOperation: ApiOperation({
    summary: '댓글 좋아요 추가/제거',
    description: '요청 시 좋아요 여부에 따라 좋아요가 추가/제거 됩니다',
  }),

  ApiParam: ApiParam({
    name: 'id',
    required: true,
    description: '댓글 아이디',
  }),

  ApiResponse: ApiResponse({
    status: 200,
    description: '좋아요 추가/제거 성공',
    schema: {
      examples: [
        {
          message: {
            code: 200,
            message: '좋아요가 취소되었습니다.',
          },
        },
        {
          message: {
            code: 200,
            message: '좋아요가 추가되었습니다.',
          },
        },
      ],
    },
  }),
};

export const uploadImageDocs = {
  ApiOperation: ApiOperation({
    summary: '이미지 업로드',
    description: '이미지 업로드 시 이미지 링크를 반환합니다',
  }),

  ApiConsumes: ApiConsumes('multipart/form-data'),
  ApiBody: ApiBody({
    description: '업로드할 이미지 파일',
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
        imageUrl: '이미지 url',
        message: {
          code: 200,
          message: '이미지 업로드가 완료되었습니다.',
        },
      },
    },
  }),
};
