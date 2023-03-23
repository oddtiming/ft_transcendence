import { Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { GameConfig, PaddleConfig, BallConfig } from "./config/game.config";
import { WebSocketServer, WebSocketGateway } from "@nestjs/websockets";
import { Server } from "socket.io";
import { Vec2 } from "./vector";
import { GameData, BallData, PaddleData } from "./game.types";
import { degToRad, checkIntersect } from "./game.utils";
import { v4 as uuidv4 } from "uuid";
import * as GameTypes from "./game.types";
const logger = new Logger("gameLogic");

@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
@Injectable()
export class GameLogic {
  constructor(private schedulerRegistry: SchedulerRegistry) {}

  @WebSocketServer()
  public server: Server;

  //Calculate game state and send server update
  async sendServerUpdate(lobby: GameTypes.GameLobby) {
    lobby.game = this.calculateGameState(lobby.game);
    this.server.emit("serverUpdate", lobby.game);
  }

  /**
   * Calculate game state and return gamestate object
   * @param gameData
   * @returns
   */
  calculateGameState(gameData: GameData): GameData {
    //Check if new round
    if (gameData.is_new_round) {
      gameData.ball = this.getRandomBallDirection(gameData);
      gameData.is_new_round = false;
      gameData.last_update_time = Date.now();
    }
    //If not new round, calculate ball position and update timestamp
    else {
      gameData.ball = this.updateBall(gameData);
      gameData.last_update_time = Date.now();
    }
    return gameData;
  }

  //Calculate ball position
  updateBall(gameData: GameData): BallData {
    //Save previous ball data, and create an object for new ball data
    const prevBall: BallData = gameData.ball;
    const curBall: BallData = new BallData();

    curBall.direction = prevBall.direction;
    curBall.speed = prevBall.speed;
    //Get a time difference between last update and this update
    const time_diff: number = (Date.now() - gameData.last_update_time) / 1000;

    //Find new ball position
    curBall.pos = Vec2.scaleAndAdd(
      prevBall.pos,
      prevBall.direction,
      prevBall.speed * time_diff
    );

    //Check if new ball position requires collision detection
    if (curBall.pos.x >= GameConfig.playAreaWidth / 2 - BallConfig.radius) {
      //Check collision between right wall and ball
      //First get intersection
      const intersect: Vec2 = checkIntersect(
        prevBall.pos,
        curBall.pos,
        GameConfig.topRight,
        GameConfig.botRight
      );
      //If return was not null there is an intersection
      if (intersect) {
        //Find the remaining of the vector that goes past the boundary
        const remainder: Vec2 = Vec2.sub(curBall.pos, intersect);
        //Add the remainder to the intersect point to get the new point
        curBall.pos = Vec2.add(intersect, remainder);
        //Invert the direction
        curBall.direction.x = -curBall.direction.x;
      }
    } else if (
      curBall.pos.x <= -(GameConfig.playAreaWidth / 2 + BallConfig.radius)
    ) {
      const intersect: Vec2 = checkIntersect(
        prevBall.pos,
        curBall.pos,
        GameConfig.topLeft,
        GameConfig.botLeft
      );
      if (intersect) {
        const remainder: Vec2 = Vec2.sub(curBall.pos, intersect);
        curBall.pos = Vec2.add(intersect, remainder);
        curBall.direction.x = -curBall.direction.x;
      }
    } else if (
      curBall.pos.y >=
      GameConfig.playAreaHeight / 2 - BallConfig.radius
    ) {
      const intersect: Vec2 = checkIntersect(
        prevBall.pos,
        curBall.pos,
        GameConfig.topLeft,
        GameConfig.topRight
      );
      if (intersect) {
        const remainder: Vec2 = Vec2.sub(curBall.pos, intersect);
        curBall.pos = Vec2.add(intersect, remainder);
        curBall.direction.y = -curBall.direction.y;
      }
    } else if (
      curBall.pos.y <= -(GameConfig.playAreaHeight / 2 + BallConfig.radius)
    ) {
      const intersect: Vec2 = checkIntersect(
        prevBall.pos,
        curBall.pos,
        GameConfig.botLeft,
        GameConfig.botRight
      );
      if (intersect) {
        const remainder: Vec2 = Vec2.sub(curBall.pos, intersect);
        curBall.pos = Vec2.add(intersect, remainder);
        curBall.direction.y = -curBall.direction.y;
      }
    }
    //If collision was with a paddle, increase ball speed

    return curBall;
  }

  //Initialize new game
  initNewGame(): GameData {
    const gameData: GameData = new GameData();

    //Setup general game properties
    gameData.match_id = uuidv4();
    gameData.is_new_round = true;
    gameData.bounds.width = GameConfig.playAreaWidth;
    gameData.bounds.height = GameConfig.playAreaHeight;
    gameData.player_left = "test";
    gameData.player_right = "test";
    gameData.player_left_ready = false;
    gameData.player_right_ready = false;

    //Randomize serve side for initial serve
    if (Math.round(Math.random()) === 0) gameData.last_serve_side = "left";
    else gameData.last_serve_side = "right";

    //Setup initial paddle state
    gameData.paddle_left.pos.y = 0;
    gameData.paddle_left.pos.x = -(
      GameConfig.playAreaWidth / 2 +
      PaddleConfig.borderOffset
    );
    gameData.paddle_right.pos.y = 0;
    gameData.paddle_right.pos.x =
      GameConfig.playAreaWidth / 2 - PaddleConfig.borderOffset;

    return gameData;
  }

  //Get a new random ball direction and velocity
  getRandomBallDirection(gameData: GameData): BallData {
    const ballData: BallData = new BallData();
    ballData.pos = new Vec2(0, 0);
    ballData.speed = BallConfig.initialSpeed;

    //Angle needs to be centered on x axis, so need to get offset from y-axis (half the remainder when angle is subracted from 180)
    const angle_offset = (180 - BallConfig.maxServeAngle) / 2;

    //Get a random value in angle range and add the offset
    const angle =
      Math.round(Math.round(Math.random() * BallConfig.maxServeAngle)) +
      angle_offset;

    //Convert the angle to a vector
    ballData.direction = new Vec2(
      Math.sin(degToRad(angle)),
      Math.cos(degToRad(angle))
    );
    //Normalize the vector
    ballData.direction = Vec2.normalize(ballData.direction);

    //If last serve was to the right, invert x value to send left
    if (gameData.last_serve_side === "right") {
      ballData.direction.x = -ballData.direction.x;
      gameData.last_serve_side = "left";
    } else gameData.last_serve_side = "right";

    return ballData;
  }
}
