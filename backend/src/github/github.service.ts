import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from '../common/utils/encryption.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class GithubService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Helper method to load Octokit dynamically in a CommonJS runtime
   */
  private async getOctokitInstance(auth: string) {
    const { Octokit } = await (eval('import("@octokit/rest")') as Promise<
      typeof import('@octokit/rest')
    >);
    return new Octokit({ auth });
  }

  getOAuthConnectUrl(userId: string): string {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const callbackUrl = this.configService.get<string>('GITHUB_CALLBACK_URL');

    if (!clientId || !callbackUrl) {
      throw new InternalServerErrorException(
        'GitHub OAuth configuration is missing',
      );
    }

    const scope = 'repo read:user';
    const state = userId;

    return `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      callbackUrl,
    )}&scope=${encodeURIComponent(scope)}&state=${state}`;
  }

  async handleOAuthCallback(code: string, userId: string): Promise<void> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error_description || 'GitHub OAuth failed',
      );
    }

    const accessToken = tokenData.access_token;

    // Dynamically instantiate Octokit
    const octokit = await this.getOctokitInstance(accessToken);
    const { data: githubUser } = await octokit.rest.users.getAuthenticated();

    // Encrypt the access token with AES-256-GCM
    const encryptedToken = this.encryptionService.encrypt(accessToken);

    // Save encrypted token and GitHub username in MongoDB
    await this.usersService.updateGithubCredentials(
      userId,
      encryptedToken,
      githubUser.login,
    );
  }

  /**
   * Exchanges an OAuth code for user profile data (used for direct GitHub login)
   */
  async exchangeCodeForUser(code: string): Promise<{
    accessToken: string;
    email: string;
    username: string;
    name: string;
  }> {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (tokenData.error || !tokenData.access_token) {
      throw new BadRequestException(
        tokenData.error_description || 'GitHub OAuth token exchange failed',
      );
    }

    const accessToken = tokenData.access_token;
    const octokit = await this.getOctokitInstance(accessToken);

    const { data: githubUser } = await octokit.rest.users.getAuthenticated();
    let email = githubUser.email;

    if (!email) {
      const { data: emails } =
        await octokit.rest.users.listEmailsForAuthenticatedUser();
      const primaryEmail = emails.find((e) => e.primary && e.verified);
      email = primaryEmail ? primaryEmail.email : emails[0]?.email;
    }

    if (!email) {
      throw new BadRequestException(
        'No verified email associated with this GitHub account',
      );
    }

    return {
      accessToken,
      email,
      username: githubUser.login,
      name: githubUser.name || githubUser.login,
    };
  }

  /**
   * Helper to retrieve an authenticated Octokit instance for the given user
   */
  async getOctokitForUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.githubAccessTokenEncrypted) {
      throw new BadRequestException('GitHub account is not connected');
    }

    const decryptedToken = this.encryptionService.decrypt(
      user.githubAccessTokenEncrypted,
    );
    return this.getOctokitInstance(decryptedToken);
  }

  /**
   * Parses a GitHub PR URL and fetches the .diff patch.
   * Uses authenticated Octokit first, with a clean fallback to raw diff fetching for public repos.
   */
  async getPullRequestDiff(
    userId: string,
    prUrl: string,
  ): Promise<{ owner: string; repo: string; prNumber: number; diff: string }> {
    // 1. Validate & Parse PR URL
    const match = prUrl
      .trim()
      .match(/^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)/);
    if (!match) {
      throw new BadRequestException(
        'Invalid GitHub PR URL format. Example: https://github.com/owner/repo/pull/123',
      );
    }

    const [, owner, repo, prNumberStr] = match;
    const prNumber = parseInt(prNumberStr, 10);

    // 2. Try authenticated Octokit request first
    try {
      const octokit = await this.getOctokitForUser(userId);
      const response = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}',
        {
          owner,
          repo,
          pull_number: prNumber,
          headers: {
            accept: 'application/vnd.github.v3.diff',
          },
        },
      );

      const diffData = response.data as unknown as string;
      if (
        diffData &&
        typeof diffData === 'string' &&
        diffData.trim().length > 0
      ) {
        return {
          owner,
          repo,
          prNumber,
          diff: diffData,
        };
      }
    } catch (authError: any) {
      // If 404, repository or PR does not exist
      if (authError?.status === 404) {
        throw new BadRequestException(
          `Pull Request #${prNumber} on ${owner}/${repo} was not found.`,
        );
      }
      // On 401/403 or other token issues, fall through to public direct fetch
    }

    // 3. Fallback: Fetch directly from GitHub Patch CDN (follows 302 redirects automatically)
    const directUrls = [
      `https://patch-diff.githubusercontent.com/raw/${owner}/${repo}/pull/${prNumber}.diff`,
      `https://github.com/${owner}/${repo}/pull/${prNumber}.diff`,
    ];

    for (const url of directUrls) {
      try {
        const rawDiffResponse = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'text/plain, application/vnd.github.v3.diff, */*',
          },
        });

        if (rawDiffResponse.ok) {
          const diffText = await rawDiffResponse.text();
          // Verify it returned real unified diff content and not HTML error page
          if (
            diffText &&
            diffText.trim().length > 0 &&
            (diffText.includes('diff --git') || diffText.includes('@@'))
          ) {
            return {
              owner,
              repo,
              prNumber,
              diff: diffText,
            };
          }
        }
      } catch (fallbackError) {
        // Continue to next URL attempt
      }
    }

    throw new BadRequestException(
      `Could not retrieve diff for ${owner}/${repo} #${prNumber}. Verify repository permissions or URL.`,
    );
  }
}
