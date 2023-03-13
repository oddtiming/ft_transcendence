import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaModule } from "../prisma/prisma.module";
import { redisModule } from "../redis/redis-module.config";
import { AuthGateway } from "./auth.gateway";
import { AuthService } from "./auth.service";

describe("AuthGateway", () => {
  let gateway: AuthGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        JwtModule.register({}),
        redisModule,
        ConfigModule
      ],
      providers: [AuthGateway, AuthService]
    }).compile();

    gateway = module.get<AuthGateway>(AuthGateway);
  });

  it("should be defined", () => {
    expect(gateway).toBeDefined();
  });
});
