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
import { GameConfig } from "./config/game.config";

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
    lobby.participants.forEach((element) => {
      this.server.in(element.socket_id).socketsJoin(lobby.lobby_id);
    });

  

    //Add new lobby to array
    this.gameModuleData.addLobby(lobby);

    //Emit lobbyCreated event to room members
    this.server.to(lobby.lobby_id).emit("lobbyCreated");
  }

  /**
   *
   * @returns
   */
  createGame(lobby: GameTypes.GameLobby): GameTypes.GameData {
    logger.log("createGame() called");

    //Create a new gameobject
    const game: GameTypes.GameData = this.gameLogic.initNewGame();

    //Create a new game object
    lobby.game = game;
    
    //Assign players to sides
    let side = "left";
    lobby.participants.forEach((element) => {
      if (element.is_player) {
        if (side === "left") {
          lobby.game.player_left = element.client_id;
          side = "right";
        } else if (side === "right") {
          lobby.game.player_right = element.client_id;
          side = "done";
        }
      }
    });

    //Add it to the games array
    this.gameModuleData.addGame(game);
    return game;
  }

  /**
   * Start the game if both players are ready
   * @method gameStart
   * @returns {}
   */
  async startGame(lobby: GameTypes.GameLobby) {
    logger.log("startGame() called");

    try {
      this.schedulerRegistry.getInterval("gameUpdateInterval" + lobby.lobby_id);
    } catch {
      logger.log("Error creating gameUpdateInterval");
      this.addGameUpdateInterval(
        lobby,
        "gameUpdateInterval" + lobby.lobby_id,
        GameConfig.serverUpdateRate
      );
    }

    //Emit gameStart event to clients so they can render the game window
  }
  //Add new gameUpdateInterval
  async addGameUpdateInterval(
    lobby: GameTypes.GameLobby,
    name: string,
    milliseconds: number
  ) {
    //Set callback function to gamestate
    const interval = setInterval(
      this.gameLogic.sendServerUpdate.bind(lobby),
      milliseconds
    );
    this.schedulerRegistry.addInterval(name, interval);
    logger.log(`Interval ${name} created`);
  }

  //Delete an interval
  deleteInterval(name: string) {
    this.schedulerRegistry.deleteInterval(name);
    logger.log(`Interval ${name} deleted!`);
  }

  /**
   * When all participants leave the lobby, lobby will be deleted
   * @method deleteLobby
   * @param {GameTypes.GameLobby} lobby
   * @returns {}
   */
  async deleteLobby(lobby: GameTypes.GameLobby) {
    lobby.participants.forEach((value: GameTypes.Participant) => {
      this.server.in(value.socket_id).socketsLeave(lobby.lobby_id);
    });
  }

  /**
   * Accepts playerReady event and starts game if both players are ready
   * @param {string} lobby_id
   * @param {string} client_id;
   */
  playerReady(lobby_id: string, client_id: string) {
    const lobby: GameTypes.GameLobby = this.gameModuleData.getLobby(lobby_id);
    if (lobby.game.player_left === client_id) {
      lobby.game.player_left_ready = true;
    } else if (lobby.game.player_right === client_id) {
      lobby.game.player_right_ready = true;
    }

    //If both players are ready start the game
    if (lobby.game.player_left_ready && lobby.game.player_right_ready) {
      this.startGame(lobby);
    }
  }
}
