import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { GithubModule } from './github/github.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRoot(process.env.MONGODB_URI as string),

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 20, // default 20 requests/minute
      },
    ]),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl =
          configService.get<string>('REDIS_URL') || 'redis://127.0.0.1:6379';
        const url = new URL(redisUrl);
        return {
          connection: {
            host: url.hostname,
            port: parseInt(url.port || '6379', 10),
            username: url.username || undefined,
            password: url.password || undefined,
            tls: url.protocol === 'rediss:' ? {} : undefined,
          },
        };
      },
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    GithubModule,
    ReviewsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
