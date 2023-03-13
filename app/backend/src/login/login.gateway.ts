import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  BaseWsExceptionFilter,
  WebSocketServer
} from "@nestjs/websockets";
import { LoginService } from "./login.service";
import { LoginDto } from "./dto/login.dto";
import { UseFilters } from "@nestjs/common";
import { Server } from "socket.io";
import { PrismaClientExceptionFilterWs } from "../prisma-client-exception.filter";

export enum LoginEnum {
  login = "login",
  signup = "signup"
}

/**
 *  Preauthorization gateway
 */
@UseFilters(new PrismaClientExceptionFilterWs())
@WebSocketGateway()
export class LoginGateway {
  @WebSocketServer() // Gives us the instance of the WebSocket server
  server: Server;

  constructor(private readonly loginService: LoginService) {}

  // OnModuleInit implementation
  onModuleInit() {
    this.server.on("connection", (socket) => {
      console.log("MyGateway: 'connection' event triggered:");
      console.log("socket.id: ", socket.id);
    });
  }

  /**
   * @param
   * @login Log into an existing user account
   * @return Return success with JWT or failure
   */
  @SubscribeMessage(LoginEnum.login)
  login(@MessageBody() loginDto: LoginDto) {
    return this.loginService.login(loginDto);
  }

  /**
   * @param
   * @signup Create a new user account
   * @return Return success with JWT or failure
   */
  @SubscribeMessage(LoginEnum.signup)
  signup(@MessageBody() loginDto: LoginDto) {
    return this.loginService.signup(loginDto);
  }
}
