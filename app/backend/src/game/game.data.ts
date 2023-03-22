import * as GameTypes from "./game.types";
import { v4 as uuidv4 } from "uuid";
import { Logger } from "@nestjs/common";

const logger = new Logger("gameData");

/**
 * Storage class for handling runtime volatile service data
 */
export class GameModuleData {
  public static queue: GameTypes.Participant[] = [];
  public static games: GameTypes.GameData[] = [];
  public static lobbies: GameTypes.GameLobby[] = [];

  /**
   * Adds player to game queue
   * @method addQueue
   * @param {GameTypes.Participant} player
   * @returns {}
   */
  addQueue(player: GameTypes.Participant) {
    GameModuleData.queue.push(player);
  }

  /**
   * Removes player from game queue
   * @method removeQueue
   * @param {GameTypes.Participant} player
   * @returns {}
   */
  removeQueue(player: GameTypes.Participant) {
    GameModuleData.queue = GameModuleData.queue.splice(
      GameModuleData.queue.indexOf(player),
      1
    );
  }

  /**
   * What does this do
   * @method  getPairQueue
   * @returns {GameTypes.Participant[]}
   *
   * @todo Fix current match systems and implement actual MMR checks
   */
  getPairQueue(): GameTypes.Participant[] {
    if (GameModuleData.queue.length >= 2) {
      const playerPair: GameTypes.Participant[] = [];
      playerPair.push(GameModuleData.queue.pop());
      playerPair.push(GameModuleData.queue.pop());
      return playerPair;
    } else {
      return null;
    }
  }

  /**
   * @param {GameTypes.GameLobby} lobby
   */
  addLobby(lobby: GameTypes.GameLobby) {
    GameModuleData.lobbies.push(lobby);
  }

  /**
   * @param {GameTypes.GameLobby} lobby
   */
  removeLobby(lobby: GameTypes.GameLobby) {
    const index = GameModuleData.lobbies.indexOf(lobby);
    GameModuleData.lobbies.splice(index, 1);
  }
}
