import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { GithubService } from './github.service';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';
import { EncryptionService } from '../common/utils/encryption.util';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('github')
export class GithubController {
  constructor(
    private readonly githubService: GithubService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @Get('oauth/connect')
  @UseGuards(JwtAccessGuard)
  connect(@Req() req: Request) {
    const user = req.user as { userId: string; email: string };
    const userId = user?.userId;

    if (!userId) {
      throw new BadRequestException('User ID not found in token payload');
    }

    const url = this.githubService.getOAuthConnectUrl(userId);
    return { url };
  }

  @Get('oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException(
        'Missing code parameter from GitHub callback',
      );
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3001';

    // 1. Check if state is a valid 24-hex MongoDB ObjectId (user is already logged in on dashboard)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(state);
    if (isObjectId) {
      await this.githubService.handleOAuthCallback(code, state);
      return res.redirect(`${frontendUrl}/dashboard?github=connected`);
    }

    // 2. Direct 1-Click GitHub Login / Sign Up from /login
    const ghUser = await this.githubService.exchangeCodeForUser(code);
    let user = await this.usersService.findByEmail(ghUser.email);

    if (!user) {
      const dummyPassword = Math.random().toString(36).slice(-16);
      const passwordHash = await bcrypt.hash(dummyPassword, 12);
      user = await this.usersService.create(
        ghUser.name,
        ghUser.email,
        passwordHash,
      );
    }

    const encryptedToken = this.encryptionService.encrypt(ghUser.accessToken);
    await this.usersService.updateGithubCredentials(
      user._id.toString(),
      encryptedToken,
      ghUser.username,
    );

    const { accessToken, refreshToken } = await this.authService.issueTokens(
      user._id.toString(),
      user.email,
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth',
    });

    return res.redirect(
      `${frontendUrl}/dashboard?token=${accessToken}&github=connected`,
    );
  }
}
