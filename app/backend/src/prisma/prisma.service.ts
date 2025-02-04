import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  ChatMemberRank,
  ChatMemberStatus,
  Prisma,
  PrismaClient
} from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import {
  ChatMemberDto,
  ChatRoomDto,
  PlayerDto,
  ProfileDto,
  UserDto,
  MessageDto
} from "../auth/dto/prisma.dto";
import config from "../config";

const logger = new Logger("PrismaService");

@Injectable()
export class PrismaService extends PrismaClient {
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
  async userExists(userId: string): Promise<boolean> {
    const user = await this.user.findUnique({ where: { id: userId } });
    return !!user;
  }
  async nickExists(nick: string): Promise<string> {
    const user = await this.user.findUnique({ where: { email: nick } });

    return user ? user.id : null;
  }

  async addUser(dto: UserDto) {
    const data: Prisma.UserCreateInput = {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      hash: dto.password
    };
    return this.user.create({ data });
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
  // Create a new chat room
  async createChatRoom(dto: ChatRoomDto): Promise<ChatRoomDto> {
    // Check if the owner UUID is valid
    // FIXME: this should use the userExists() method
    // TODO: remove this code when authentication is enabled
    logger.log(`dto.owner: ${dto.owner}`);
    const userID = await this.nickExists(dto.owner);
    logger.log(`userID: ${userID}`);
    console.log(dto);
    if (dto.owner && !userID) {
      throw new Error("Invalid owner UUID");
    }

    // Prepare the data for creating a chat room
    const data: Prisma.ChatRoomCreateInput = {
      status: dto.status,
      name: dto.name,
      password: dto.password
    };

    // Connect the owner if provided
    if (dto.owner) {
      data.owner = { connect: { id: userID } };
      // Add it as a chat member
      data.members = {
        create: [
          {
            member: { connect: { id: userID } },
            status: ChatMemberStatus.OK,
            rank: ChatMemberRank.OWNER
          }
        ]
      };
    }
    return this.chatRoom.create({ data });
  }

  // Get a chat room by ID
  async getChatRoom(id: number): Promise<ChatRoomDto | null> {
    return this.chatRoom.findUnique({ where: { id } });
  }

  // Get a chat room by ID
  async getChatRoomId(name: string): Promise<number | null> {
    const room = await this.chatRoom.findUnique({ where: { name } });

    return room ? room.id : null;
  }

  // Update a chat room
  async updateChatRoom(
    id: number,
    dto: Partial<ChatRoomDto>
  ): Promise<ChatRoomDto> {
    const data: Prisma.ChatRoomCreateInput = {
      status: dto.status,
      name: dto.name,
      password: dto.password
    };
    return this.chatRoom.update({ where: { id }, data });
  }

  // Delete a chat room
  async deleteChatRoom(id: number): Promise<ChatRoomDto> {
    return this.chatRoom.delete({ where: { id } });
  }

  // Add a new message to a chat room
  async addMessageToChatRoom(dto: MessageDto): Promise<any> {
    // Check if the owner UUID is valid
    const userExists = await this.userExists(dto.senderId);
    if (dto.senderId && !userExists) {
      logger.log(`userExists: ${userExists}`);
      return;
    }

    // Shape the data to be inserted into the database
    const data: Prisma.MessageCreateInput = {
      content: dto.content,
      sender: { connect: { id: dto.senderId } },
      room: { connect: { id: dto.roomId } }
    };

    // Add the message to the database and update the chat room's last activity
    return this.$transaction([
      this.message.create({ data }),
      this.chatRoom.update({
        where: { id: dto.roomId },
        data: { updatedAt: new Date() }
      })
    ]);
  }

  // Get all messages in a chat room
  async getMessagesInChatRoom(roomId: number): Promise<MessageDto[]> {
    return this.message.findMany({ where: { roomId } });
  }
  addMatch(dto1: PlayerDto, dto2: PlayerDto) {
    return dto1;
  }
}
