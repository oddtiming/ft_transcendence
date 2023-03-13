import { DynamicModule, FactoryProvider, ModuleMetadata } from '@nestjs/common';
import { Module } from '@nestjs/common';
import IORedis, { Redis, RedisOptions } from 'ioredis';

export const IORedisKey = 'IORedis'; // to represent the provider

type RedisModuleOptions = {
  connectionOptions: RedisOptions; // as defined by IORedis
  onClientReady?: (client: Redis) => void;
};

type RedisAsyncModuleOptions = {
  useFactory: (
    ...args: any[]
  ) => Promise<RedisModuleOptions> | RedisModuleOptions; // return types
} & Pick<ModuleMetadata, 'imports'> & // ModuleMetadata has definition of type for imports
  Pick<FactoryProvider, 'inject'>; // FactoryProvider has definition of type for inject

@Module({})
export class RedisModule {
  static async registerAsync({
    useFactory,
    imports,
    inject,
  }: RedisAsyncModuleOptions): Promise<DynamicModule> {
    const redisProvider = {
      provide: IORedisKey, // string const to represent the provider
      // Overloads the useFactory provided to generate and init client
      useFactory: async (...args) => {
        const { connectionOptions, onClientReady } = await useFactory(...args);

        // Use useFactory() returned values to init client
        const client = new IORedis(connectionOptions);
        onClientReady(client);

        return client;
      },
      inject, // forward the injected value/class
    };

    return {
      module: RedisModule,
      imports,
      providers: [redisProvider], //
      exports: [redisProvider], // expose the newly created provider
    };
  }
}
