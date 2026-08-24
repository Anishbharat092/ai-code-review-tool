import { Module } from '@nestjs/common';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { EncryptionService } from '../common/utils/encryption.util';

@Module({
  imports: [UsersModule, AuthModule],
  controllers: [GithubController],
  providers: [GithubService, EncryptionService],
  exports: [GithubService],
})
export class GithubModule {}
