import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';

@Catch(RpcException)
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: RpcException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const error: any = exception.getError();
    const message = typeof error === 'string' ? error : error.message || 'Internal error';

    // Mapping gRPC status code to HTTP status
    const grpcCode = error.code ?? status.UNKNOWN;

    const httpStatus = this.mapGrpcCodeToHttp(grpcCode);

    response.status(httpStatus).json({
      statusCode: httpStatus,
      message,
      error: grpcCode,
    });
  }

  private mapGrpcCodeToHttp(code: number): HttpStatus {
    switch (code) {
      case status.INVALID_ARGUMENT:
        return HttpStatus.BAD_REQUEST;
      case status.NOT_FOUND:
        return HttpStatus.NOT_FOUND;
      case status.ALREADY_EXISTS:
        return HttpStatus.CONFLICT;
      case status.PERMISSION_DENIED:
      case status.UNAUTHENTICATED:
        return HttpStatus.UNAUTHORIZED;
      case status.UNAVAILABLE:
        return HttpStatus.SERVICE_UNAVAILABLE;
      case status.DEADLINE_EXCEEDED:
        return HttpStatus.REQUEST_TIMEOUT;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
