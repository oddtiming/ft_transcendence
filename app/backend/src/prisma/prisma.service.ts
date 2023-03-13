import * as argon from "argon2";
import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleInit
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import {
  ChatMemberDto,
  ChatRoomDto,
  PlayerDto,
  ProfileDto,
  UserDto
} from "../auth/dto/prisma.dto";
import config from "../config";
import { WsException } from "@nestjs/websockets";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on("beforeExit", async () => {
      await app.close();
    });
  }

  constructor(configService: ConfigService) {
    // Will call the constructor of the extended class
    super({
      datasources: {
        db: {
          url: config.database_url
        }
      }
    });
    Logger.log(configService.get("DATABASE_URL"));
  }

  /**
   * To be executed in testing, or to fully cleanup the db.
   * If you're not sure, probs best not to touch it.
   */
  cleanDb() {
    /**
     * Transaction delegates proper deletion order to prisma.
     * Accepts an array of operations.
     */
    return this.$transaction([
      this.chatRoom.deleteMany(),
      this.user.deleteMany(),
      this.profile.deleteMany(),
      this.chatMember.deleteMany(),
      this.message.deleteMany(),
      this.match.deleteMany(),
      this.player.deleteMany()
    ]);
  }
  async addUser(dto: any) {
    try {
      const hash = await argon.hash(dto.password);
      Logger.log("dto.email: " + dto.email);
      Logger.log("dto.hash: " + dto.password);
      const user = await this.user.create({
        data: {
          email: dto.email,
          hash
        }
      });
      Logger.log("Successfully created user " + user.email + ".");
      return user;
    } catch (error) {
      Logger.log("error code: " + error.code);
      Logger.error(error);
      throw new WsException(error.code);
    }
  }

  editUser(dto: UserDto) {
    return dto;
  }

  deleteUser(dto: UserDto) {
    return dto;
  }
  addProfile(dto: ProfileDto) {
    return dto;
  }
  editProfile(dto: ProfileDto) {
    return dto;
  }
  addChatMember(dto: ChatMemberDto) {
    return dto;
  }
  editChatMember(dto: ChatMemberDto) {
    return dto;
  }
  deleteChatMember(dto: ChatMemberDto) {
    return dto;
  }
  addChatRoom(dto: ChatRoomDto) {
    return dto;
  }
  editChatRoom(dto: ChatRoomDto) {
    return dto;
  }
  deleteChatRoom(dto: ChatRoomDto) {
    return dto;
  }
  addMatch(dto1: PlayerDto, dto2: PlayerDto) {
    return dto1;
  }
}
