import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpServer,
  HttpStatus,
  Logger
} from "@nestjs/common";
import { APP_FILTER, BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { Prisma } from "@prisma/client";

/**
 * Code for PrismaClientExceptionFilter adapted from:
 * https://github.com/notiz-dev/nestjs-prisma/blob/main/lib/prisma-client-exception.filter.ts
 */
export type ErrorCodesStatusMapping = {
  [key: string]: number;
};

/**
 * {@link PrismaClientExceptionFilter} catches {@link Prisma.PrismaClientKnownRequestError} and {@link Prisma.NotFoundError} exceptions.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilterHttp extends BaseExceptionFilter {
  /**
   * default error codes mapping
   *
   * Error codes definition for Prisma Client (Query Engine)
   * @see https://www.prisma.io/docs/reference/api-reference/error-reference#prisma-client-query-engine
   */
  private errorCodesStatusMapping: ErrorCodesStatusMapping = {
    P2000: HttpStatus.BAD_REQUEST,
    P2002: HttpStatus.CONFLICT,
    P2025: HttpStatus.NOT_FOUND
  };

  /**
   * @param applicationRef
   * @param errorCodesStatusMapping
   */
  constructor(
    applicationRef?: HttpServer,
    errorCodesStatusMapping: ErrorCodesStatusMapping = null
  ) {
    super(applicationRef);
    if (errorCodesStatusMapping) {
      this.errorCodesStatusMapping = Object.assign(
        this.errorCodesStatusMapping,
        errorCodesStatusMapping
      );
    }
  }

  /**
   * @param exception
   * @param host
   * @returns
   */
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const statusCode = this.errorCodesStatusMapping[exception.code];
    const message =
      `[${exception.code}]: ` + this.exceptionShortMessage(exception.message);

    if (!Object.keys(this.errorCodesStatusMapping).includes(exception.code)) {
      return super.catch(exception, host);
    }

    super.catch(new HttpException({ statusCode, message }, statusCode), host);
  }

  private exceptionShortMessage(message: string): string {
    const shortMessage = message.substring(message.indexOf("→"));
    return shortMessage
      .substring(shortMessage.indexOf("\n"))
      .replace(/\n/g, "")
      .trim();
  }
}

export function providePrismaClientExceptionFilterHttp(
  errorCodesStatusMapping?: ErrorCodesStatusMapping
) {
  return {
    provide: APP_FILTER,
    useFactory: ({ httpAdapter }: HttpAdapterHost) => {
      return new PrismaClientExceptionFilterHttp(
        httpAdapter,
        errorCodesStatusMapping
      );
    },
    inject: [HttpAdapterHost]
  };
}
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";

@Catch(WsException)
export class PrismaClientExceptionFilterWs extends BaseWsExceptionFilter {
  catch(exception: WsException, host: ArgumentsHost) {
    console.log("Oopsie fucky is happening in WS Exception filter");
    Logger.error(exception);
    Logger.error(host);
    const client = host.switchToWs().getClient();
    let message = exception.message.replace(/\n/g, "");

    Logger.log(message);
    Logger.log(exception.getError());

    let status = "Unknown error";
    switch (exception.getError()) {
      case "P2002": {
        status = "conflict";
        message += " : Unique property is already taken.'";
        break;
      }
      case "P2009": {
        status = "Missing required value";
        message += ": Entry is missing a required field.'";
        break;
      }
      case "P2025": {
        status = "Resource was not found";
        message += ": Database resource was not found.'";
        break;
      }
      default:
        super.catch(exception, host);
        break;
    }
    client.emit("error", {
      status,
      message
    });
  }
}

import { ExceptionFilter, ExecutionContext } from "@nestjs/common";

@Catch(
  Prisma.PrismaClientKnownRequestError || Prisma.PrismaClientUnknownRequestError
)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception:
      | Prisma.PrismaClientKnownRequestError
      | Prisma.PrismaClientUnknownRequestError,
    context: ExecutionContext
  ) {
    const httpContext = context.switchToHttp();
    const isHttp = httpContext.getRequest();

    if (isHttp) {
      throw new HttpException(exception, 500);
    } else {
      throw new PrismaClientExceptionFilterWs();
    }
  }
}
