import { HttpStatusCodes } from '@common/constants/http-status-code';

export const ErrorMessages = {
  AUTH: {
    INVALID_REFRESH_TOKEN: {
      code: HttpStatusCodes.UNAUTHORIZED,
      text: '유효하지 않은 리프레시 토큰입니다.',
    },
    USER_NOT_FOUND: {
      code: HttpStatusCodes.NOT_FOUND,
      text: '사용자를 찾을 수 없습니다.',
    },
    TOKEN_EXPIRED: {
      code: HttpStatusCodes.UNAUTHORIZED,
      text: '토큰이 만료되었습니다.',
    },
  },
  VALIDATION: {
    MISSING_REQUIRED_FIELDS: {
      code: HttpStatusCodes.BAD_REQUEST,
      text: '필수 입력 필드가 누락되었습니다.',
    },
    INVALID_EMAIL: {
      code: HttpStatusCodes.BAD_REQUEST,
      text: '유효하지 않은 이메일 형식입니다.',
    },
  },
  SERVER: {
    DATABASE_ERROR: {
      code: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      text: '데이터베이스 작업 중 오류가 발생했습니다.',
    },
    INTERNAL_ERROR: {
      code: HttpStatusCodes.INTERNAL_SERVER_ERROR,
      text: '서버에서 오류가 발생했습니다.',
    },
  },
};
