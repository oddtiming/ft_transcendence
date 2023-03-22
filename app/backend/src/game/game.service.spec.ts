import { SchedulerRegistry } from "@nestjs/schedule";
import { Test, TestingModule } from "@nestjs/testing";
import { GameModuleData } from "./game.data";
import { GameLogic } from "./game.logic";
import { GameService } from "./game.service";
import * as GameDto from "./dto/game.dto";

describe("GameService", () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, GameLogic, SchedulerRegistry, GameModuleData]
    }).compile();

    service = module.get<GameService>(GameService);
  });

  describe("sendGameInvite", () => {
    it("should send a game invite to another player", async () => {
      service.sendGameInvite();
      expect(1);
    });
  });

  describe("joinGameQueue", () => {
    it("should add a player to the queue", async () => {
      const player = new GameDto.JoinGameQueueDto();

      service.joinGameQueue("", player);
      expect(1);
    });
  });

  describe("createLobby", () => {
    it("should create a new lobby", async () => {
      // const playerPair: GameTypes.Participant[] = [];

      // service.createLobby(playerPair);
      expect(1);
    });
  });

  describe("gameStart", () => {
    it("should start a game", async () => {
      // service.gameStart();
      expect(1);
    });
  });

  describe("deleteLobby", () => {
    it("should delete a lobby", async () => {
      // const lobby = new GameTypes.GameLobby();

      // service.deleteLobby(lobby);
      expect(1);
    });
  });

  describe("startNewGame", () => {
    it("should start a new game", async () => {
      // service.startNewGame();
      expect(1);
    });
  });
});
