export class MyApiResponse<T> {
  message: {
    code: number; // HTTP 상태 코드
    text: string; // 메시지
  };

  [key: string]: any; // 동적으로 다른 필드를 추가 가능

  constructor(statusCode: number, message: string, additionalFields?: T) {
    this.message = {
      code: statusCode,
      text: message,
    };

    // 추가 데이터를 최상위 레벨에 병합
    if (additionalFields) {
      Object.assign(this, additionalFields); // `data` 키 없이 병합
    }
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
