import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/, {
    message:
      'Invalid GitHub PR URL format (e.g., https://github.com/owner/repo/pull/123)',
  })
  prUrl!: string;
}
