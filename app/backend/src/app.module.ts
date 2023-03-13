import { CacheModule, Module } from "@nestjs/common";
import { AppService } from "./app.service";

import { ServeStaticModule } from "@nestjs/serve-static";
import { join } from "path";
import { ChatModule } from "./chat/chat.module";
import { GameModule } from "./game/game.module";
import { ProfileModule } from "./profile/profile.module";
import { LoginModule } from "./login/login.module";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaModule } from "./prisma/prisma.module";
import { ConfigModule } from "@nestjs/config";
import { configValidationSchema } from "./config/config.schema";
import * as redisStore from "cache-manager-redis-store";
import { AuthModule } from "./auth/auth.module";
import { redisModule } from "./redis/redis-module.config";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "..", "frontend", "build")
    }),
    ChatModule,
    GameModule,
    ProfileModule,
    LoginModule,
    PrismaModule,
    AuthModule,
    ConfigModule.forRoot({
      envFilePath: "../.env",
      // validationSchema: configValidationSchema,
      isGlobal: true // Expose the module globally
    }), // Loads env vars. Uses dotenv library under the hood
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      redisInstanceName: "redis",
      host: "localhost",
      port: 6379
    }),
    redisModule
  ],
  controllers: [],
  providers: [AppService, PrismaService]
})
export class AppModule {}
