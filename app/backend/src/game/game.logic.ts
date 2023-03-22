import { Logger } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { GameConfig, PaddleConfig, BallConfig } from "./config/game.config";
import { WebSocketServer, WebSocketGateway } from "@nestjs/websockets";
import { Server } from "socket.io";
import * as vec2 from "gl-vec2";
import { GameData, BallData, PaddleData, Vec2, Vec } from "./game.types";
import { degToRad, intersect } from "./game.utils";
import { v4 as uuidv4 } from "uuid";
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

  //Create a new game instance
  async createGame(gameState: GameData) {
    //Create new gameData object
    gameState = this.initNewGame();
    logger.log("New game object created");
    //Add the gameUpdateInterval
    // if (!this.schedulerRegistry.getInterval('gameUpdateInterval'))
    this.addGameUpdateInterval(
      "gameUpdateInterval",
      GameConfig.serverUpdateRate
    );
  }

  //Calculate game state and send server update
  async sendServerUpdate(gameState: GameData) {
    gameState = this.calculateGameState(gameState);
    this.server.emit("serverUpdate", gameState);
  }

  //Calculate game state and return gamestate object
  calculateGameState(gameData: GameData): GameData {
    //Check if new round
    if (gameData.is_new_round) {
      gameData.last_update_time = Date.now();
      gameData.ball = this.getRandomBallDirection(gameData);
      gameData.is_new_round = false;
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
    const prev: BallData = gameData.ball;
    const cur: BallData = new BallData();
    const time_diff: number = (Date.now() - gameData.last_update_time) / 1000;

    cur.direction = prev.direction;
    cur.speed

    const prevPos: Vec = [gameData.ball.pos.x, gameData.ball.pos.y];
    const direction: Vec = [gameData.ball.direction.x, gameData.ball.pos.y];
    const curPos: Vec = [0,0];
    vec2.scaleAndAdd(curPos, prevPos, direction, prev.speed * time_diff);
    //Check if current position is outside of boundaries
    if (curPos[0] >= GameConfig.playAreaWidth / 2 - BallConfig.radius) {
      //Find intersection with right wall
      const intersectPoint: Vec =  intersect(prevPos, curPos, [GameConfig.playAreaWidth / 2, GameConfig.playAreaHeight / 2], [GameConfig.playAreaWidth / 2, -(GameConfig.playAreaHeight / 2)]);
      //Get remainder of vector by subtracting intersect from curPos
      const remainder: Vec = [0,0];
      vec2.sub(remainder, curPos, intersectPoint);
      //Find length of remainder, then reflect the direction vector and then apply scaleAndAdd to the intersect point
      const length: number = vec2.len(remainder);
      direction[0] = -direction[0];
      vec2.scaleAndAdd(curPos, intersectPoint, direction, length);

      cur.direction.x = -cur.direction.x;
    } else if (curPos[0] <= -(GameConfig.playAreaWidth / 2) + BallConfig.radius) {
      cur.direction.x = -cur.direction.x;
    } else if (curPos[1] >= GameConfig.playAreaHeight / 2 - BallConfig.radius) {
      cur.direction.y = -cur.direction.y;
    } else if (curPos[1] <= -(GameConfig.playAreaHeight / 2) + BallConfig.radius) {
      cur.direction.y = -cur.direction.y;
    }
    else{
      [cur.pos.x, cur.pos.y] = vec2.scaleAndAdd(
        [cur.pos.x, cur.pos.y],
        [prev.pos.x, prev.pos.y],
        [prev.direction.x, prev.direction.y],
        prev.speed * time_diff
      );

    }

    //Apply data to ball object



   
    cur.direction = prev.direction;
    cur.speed = prev.speed;
    
    //Check intersection between line(prevBall, currBall) and game border/paddle
    //If there is an intersection, then we need to find the proportion of the vector that is outside the game area or behind the paddle
    //The final position in this remaining vector added to the intersection point
    //Check for collision with each wall
    //hacky temporary solve
    // if (cur.pos.x >= GameConfig.playAreaWidth / 2 - BallConfig.radius) {
    //   cur.direction.x = -cur.direction.x;
    // } else if (cur.pos.x <= -(GameConfig.playAreaWidth / 2) + BallConfig.radius) {
    //   cur.direction.x = -cur.direction.x;
    // } else if (cur.pos.y >= GameConfig.playAreaHeight / 2 - BallConfig.radius) {
    //   cur.direction.y = -cur.direction.y;
    // } else if (cur.pos.y <= -(GameConfig.playAreaHeight / 2) + BallConfig.radius) {
    //   cur.direction.y = -cur.direction.y;
    // }

    return cur;
  }

  //Initialize new game
  initNewGame(): GameData {
    const gameData: GameData = new GameData();

    //Setup general game properties
    gameData.match_id = uuidv4();
    gameData.is_new_round = true;
    gameData.bounds.width = GameConfig.playAreaWidth;
    gameData.bounds.height = GameConfig.playAreaHeight;
    gameData.player_left_ready = false;
    gameData.player_right_ready = false;

    //Randomize serve side for initial serve
    if (Math.round(Math.random()) === 0) gameData.last_serve_side = "left";
    else gameData.last_serve_side = "right";

    //Setup initial paddle state
    gameData.paddle_left.pos.y = 0;
    gameData.paddle_left.pos.x = -(
      GameConfig.playAreaWidth / 2 -
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
    ballData.pos.x = 0;
    ballData.pos.y = 0;
    ballData.speed = BallConfig.initialSpeed;

    //Angle needs to be centered on x axis, so need to get offset from y-axis (half the remainder when angle is subracted from 180)
    const angle_offset = (180 - BallConfig.maxServeAngle) / 2;

    //Get a random value in angle range and add the offset
    const angle =
      Math.round(Math.round(Math.random() * BallConfig.maxServeAngle)) +
      angle_offset;

    //Convert the angle to a vector
    [ballData.direction.x, ballData.direction.y] = vec2.set(
      [ballData.direction.x, ballData.direction.y],
      Math.sin(degToRad(angle)),
      Math.cos(degToRad(angle))
    );

    //Normalize the vector
    [ballData.direction.x, ballData.direction.y] = vec2.normalize(
      [ballData.direction.x, ballData.direction.y],
      [ballData.direction.x, ballData.direction.y]
    );

    //If last serve was to the right, invert x value to send left
    if (gameData.last_serve_side === "right") {
      ballData.direction.x = -ballData.direction.x;
      gameData.last_serve_side = "left";
    } else gameData.last_serve_side = "right";

    return ballData;
  }

  //Add new gameUpdateInterval
  async addGameUpdateInterval(name: string, milliseconds: number) {
    //Set callback function to gamestate
    const interval = setInterval(
      this.sendServerUpdate.bind(this),
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
}
