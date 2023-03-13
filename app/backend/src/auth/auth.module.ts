import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./strategy";
import { SessionSerializer } from "./session.serializer";
import { FortyTwoStrategy } from "./strategy/ft.strategy";
import { AuthGateway } from "./auth.gateway";
import { redisModule } from "../redis/redis-module.config";

@Module({
  imports: [JwtModule.register({}), PrismaModule, redisModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    FortyTwoStrategy,
    SessionSerializer,
    AuthGateway
  ]
})
export class AuthModule {}
