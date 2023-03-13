import { Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisModule } from "./redis.module";

/**
 * We use the registerAsync to import the ConfigModule and
 * use+inject the ConfigService
 */
export const redisModule = RedisModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const logger = new Logger("RedisModule"); // Prefix all logs wirth RedisModule

    return {
      connectionOptions: {
        host: configService.get("REDIS_HOST"),
        port: configService.get("REDIS_PORT")
      },
      // Check the output from the client
      onClientReady: (client) => {
        logger.log("Redis client ready");

        client.on("error", (err) => {
          logger.error("Redis Client Error: ", err);
        });

        client.on("connect", () => {
          logger.log(
            `Connected to redis on ${client.options.host}:${client.options.port}`
          );
        });
      }
    };
  },
  inject: [ConfigService]
});
