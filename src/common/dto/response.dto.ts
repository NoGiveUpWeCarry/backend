export class ApiResponse<T> {
  message: {
    code: number; // HTTP 상태 코드
    text: string; // 메시지
  };
  data: T | null;

  constructor(statusCode: number, message: string, data?: T) {
    this.message = {
      code: statusCode,
      text: message,
    };
    this.data = data || null;
  }
}

export class ErrorResponse {
  message: {
    code: number; // HTTP 상태 코드
    text: string; // 에러 메시지
  };

  constructor(statusCode: number, message: string) {
    this.message = {
      code: statusCode,
      text: message,
    };
  }
}
