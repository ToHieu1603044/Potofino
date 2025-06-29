import {
  Catch,
  RpcExceptionFilter,
  ArgumentsHost,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { RpcException } from '@nestjs/microservices';
import {
  DomainException,
} from '../../../domain/exceptions/domain.exception';
import { UnauthorizedException } from '../../../domain/exceptions/unauthorized.exception';
import { ConflictException } from '../../../domain/exceptions/conflict.exception';
import { BadRequestException } from '../../../domain/exceptions/bad-request.exception';
import { NotFoundException } from '@nestjs/common'; // dùng của NestJS

@Catch()
export class RpcExceptionToRpcErrorFilter implements RpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    let error: any;

    if (exception instanceof RpcException) {
      error = exception.getError();
    } else {
      error = exception;
    }

    let rpcError: any;

    if (error instanceof UnauthorizedException) {
      rpcError = { code: 16, message: error.message };
    } else if (error instanceof ConflictException) {
      rpcError = { code: 6, message: error.message };
    } else if (error instanceof NotFoundException) {
      rpcError = { code: 5, message: error.message };
    } else if (error instanceof BadRequestException) {
      rpcError = { code: 3, message: error.message };
    } else if (error instanceof DomainException) {
      rpcError = { code: 13, message: `Domain Error: ${error.message}` };
    } else if (error instanceof Error) {
      rpcError = { code: 2, message: `Internal Server Error: ${error.message}` };
    } else {
      rpcError = { code: 2, message: `Unknown error: ${JSON.stringify(error)}` };
    }

    console.error('Caught RPC Exception:', exception);

    return throwError(() => new RpcException(rpcError));
  }
}
