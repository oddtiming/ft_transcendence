import { Logger } from "@nestjs/common";
import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { Socket } from "socket.io";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";

const logger = new Logger("AuthGateway");

@WebSocketGateway()
export class AuthGateway {
  constructor(private authService: AuthService) {}

  @SubscribeMessage("signup")
  signup(client: Socket, payload: any) {
    payload = JSON.parse(payload);
    const dto: AuthDto = { email: payload.email, password: payload.password };

    console.log(dto);
    logger.log(
      `Received signup request from ${client.id} with email: ${payload.email}`
    );
    logger.log(`${payload.password}`);

    const ret = this.authService.signup(client, dto);
    client.handshake.auth = ret;
  }

  @SubscribeMessage("auth/login")
  async login(client: any, payload: string) {
    console.log(client);
    console.log(client.handshake.auth);
    return {
      client,
      payload
    };
  }
}
