

import { Vec2 } from "./vector";

export type Vec = number[];

export class BallData {
  pos: Vec2 = new Vec2();
  direction: Vec2 = new Vec2();
  speed: number;
}

export class PaddleData {
  pos: Vec2 = new Vec2();
}

export class GameBounds {
  width: number;
  height: number;
}

export class GameData {
  match_id: string;
  last_update_time: number;
  is_new_round: boolean;
  last_serve_side: string;
  bounds: GameBounds = new GameBounds();
  ball: BallData = new BallData();
  paddle_left: PaddleData = new PaddleData();
  paddle_right: PaddleData = new PaddleData();
  player_left_ready: boolean;
  player_right_ready: boolean;
}

/**
 * Players and spectators are both arrays of clientIDs
 */
export class GameLobby {
  participants: Participant[] = [];
  players: string[] = [];
  spectators: string[] = [];
  lobby_id: string;
  match_id: string;
  gamestate: GameData;
  created_at: number;
}

/**
 *
 */
export class Participant {
  client_id: string;
  socket_id: string;  /** This socket_id needs to be kept up to date */
  user_name: string;
  is_player: boolean;
  mmr?: number;
  diplay_name?: string; /** @todo add in display name at a later time*/
  queue_join_time?: number;
}
