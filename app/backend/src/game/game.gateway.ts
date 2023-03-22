import {
  WebSocketServer,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";

import { Logger } from "@nestjs/common";
import {
  JoinGameInviteDto,
  JoinGameQueueDto,
  PlayerReadyDto
} from "./dto/game.dto";

/** Create logger for module */
const logger = new Logger("gameGateway");

/**
 * Websocket gateway for game module
 */
@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class GameGateway {
  constructor(private readonly gameService: GameService) {}

  // Load the server socket locally
  @WebSocketServer()
  server: Server;

  /**
   * Gateway for a client sent game invite
   * @method sendGameInvite
   * @param {Socket} client this is the client socket info
   * @param {JoinGameInviteDto} joinGameInviteDto
   * @returns {}
   * @listens sendGameInvite
   */
  @SubscribeMessage("sendGameInvite")
  async sendGameInvite(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinGameInviteDto: JoinGameInviteDto
  ) {
    logger.log("Server received sendGameInvite from: " + client.id);
    this.gameService.sendGameInvite();
  }

  /**
   * Join matchmaking queue for new game
   * @method joinGameQueue
   * @param {Socket} client
   * @param {JoinGameQueueDto} joinGameQueueDto
   * @returns {}
   * @listens joinGameQueue
   */
  @SubscribeMessage("joinGameQueue")
  async joinGameQueue(
    @ConnectedSocket() client: Socket,
    @MessageBody() joinGameQueueDto: JoinGameQueueDto
  ) {
    logger.log("Server received joinGameQueue from: " + client.id);
    this.gameService.joinGameQueue(client.id, joinGameQueueDto);
  }

  /**
   * Leave matchmaking queue
   * @method leaveGameQueue
   * @param {Socket} client
   * @returns {}
   * @listens leaveGameQueue
   */
  @SubscribeMessage("leaveGameQueue")
  async leaveGameQueue(@ConnectedSocket() client: Socket) {
    logger.log("Server received leaveGameQueue from: " + client.id);
  }

  /**
   * Handle playerReady event and start game when both players ready
   * @method playerReady
   * @param {Socket} client
   * @param {PlayerReadyDto} playerReadyDto
   * @returns {}
   * @listens playerReady
   */
  @SubscribeMessage("playerReady")
  async playerReady(
    @ConnectedSocket() client: Socket,
    @MessageBody() playerReadyDto: PlayerReadyDto
  ) {
    logger.log("Server received playerReady from: " + client.id);
    this.gameService.gameStart();
  }
}
