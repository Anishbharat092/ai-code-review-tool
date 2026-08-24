import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email?: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService, // 2. Inject UsersService here
  ) {}

  @Post('signup')
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.signup(dto);

    this.setRefreshCookie(response, refreshToken);

    return {
      accessToken,
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    this.setRefreshCookie(response, refreshToken);

    return {
      accessToken,
    };
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = request.user['userId'];
    const refreshToken = request.cookies?.refreshToken;

    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refresh(userId, refreshToken);

    this.setRefreshCookie(response, newRefreshToken);

    return {
      accessToken,
    };
  }

  @Post('logout')
  @UseGuards(JwtRefreshGuard)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = request.user['userId'];

    await this.authService.logout(userId);

    this.clearRefreshCookie(response);

    return {
      message: 'Logged out successfully',
    };
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const dbUser = await this.usersService.findById(req.user.userId);
    if (!dbUser) {
      throw new NotFoundException('User not found');
    }

    return {
      id: dbUser._id,
      email: dbUser.email,
      name: dbUser.name,
      githubConnected: Boolean(dbUser.githubAccessTokenEncrypted),
      githubUsername: dbUser.githubUsername || null,
    };
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    const isProd = this.configIsProduction();
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearRefreshCookie(response: Response): void {
    const isProd = this.configIsProduction();
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
    });
  }
  private configIsProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
