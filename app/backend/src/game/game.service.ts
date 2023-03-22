import { Injectable } from "@nestjs/common";
import { WebSocketServer, WebSocketGateway } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { GameLogic } from "./game.logic";
import { GameModuleData } from "./game.data";
import * as GameTypes from "./game.types";
import * as GameDto from "./dto/game.dto";
import { v4 as uuidv4 } from "uuid";

const logger = new Logger("gameService");

/**
 * GameService class
 * @property {SchedulerRegistry} schedulerRegistry
 * @property {GameLogic} gameLogic
 * @property {GameModuleData} gameModuleData
 */
@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
@Injectable()
export class GameService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private gameLogic: GameLogic,
    private gameModuleData: GameModuleData
  ) {}

  /** Get local instance of websocker server */
  @WebSocketServer()
  public server: Server;
  private gameState: GameTypes.GameData;

  /**
   * Creates a new game lobby with sender and invitee as players
   * @method sendGameInvite
   * @returns {}
   *
   * @todo add timeout for response
   * @todo pass both players data to createLobby
   */
  async sendGameInvite() {
    logger.log("joinGameInvite() called");
  }

  /**
   * Adds player to the game queue and tries to find a match
   * @method joinGameQueue
   * @param {string} socket - client.id of client socket
   * @param {GameDto.JoinGameQueueDto} player
   * @returns {}
   */
  async joinGameQueue(socket: string, player: GameDto.JoinGameQueueDto) {
    logger.log("joinGameQueue() called");

    //Create new player object
    const newPlayer: GameTypes.Participant = {
      client_id: uuidv4(),
      socket_id: socket,
      user_name: "test",
      is_player: true
    };
    //Add player to queue
    this.gameModuleData.addQueue(newPlayer);
    //Attempt to retrieve a pair of players
    const playerPair: GameTypes.Participant[] =
      this.gameModuleData.getPairQueue();
    //If successful call createLobby()
    if (playerPair) {
      this.createLobby(playerPair);
    }
  }

  /**
   * Emit event to tell client that lobby has been successfully created
   * @method createLobby
   * @param {GameTypes.Participant[]} playerPair
   * @returns {}
   */
  async createLobby(playerPair: GameTypes.Participant[]) {
    logger.log("createLobby() called");

    //Create a new lobby
    const lobby = new GameTypes.GameLobby();
    lobby.participants.push(playerPair.pop());
    lobby.participants.push(playerPair.pop());
    lobby.created_at = Date.now();
    lobby.lobby_id = uuidv4();

    //Create a new websocket room and subscribe players
    this.server.in(playerPair[0].socket_id).socketsJoin(lobby.lobby_id);
    this.server.in(playerPair[1].socket_id).socketsJoin(lobby.lobby_id);

    //Add new lobby to array
    this.gameModuleData.addLobby(lobby);

    //Emit lobbyCreated event to room members
    this.server.to(lobby.lobby_id).emit("lobbyCreated");
  }

  /**
   * Start the game if both players are ready
   * @method gameStart
   * @returns {}
   */
  async gameStart() {
    logger.log("gameStart() called");

    if (this.gameState.player_left_ready && this.gameState.player_right_ready)
      this.startNewGame();

    //Emit gameStart event to clients so they can render the game window
  }

  /**
   * When all participants leave the lobby, lobby will be deleted
   * @method deleteLobby
   * @param {GameTypes.GameLobby} lobby
   * @returns {}
   */
  async deleteLobby(lobby: GameTypes.GameLobby) {
   lobby.participants.forEach( (value: GameTypes.Participant) => {
    this.server.in(value.socket_id).socketsLeave(lobby.lobby_id);
   })
  }

  /**
   * Creates a new game instance
   * @method startNewGame
   * @returns {}
   */
  async startNewGame() {
    logger.log("startNewGame() called");

    try {
      this.schedulerRegistry.getInterval("gameUpdateInterval");
    } catch {
      logger.log("Error creating gameUpdateInterval");
      this.gameLogic.createGame(this.gameState);
    }
  }
}
