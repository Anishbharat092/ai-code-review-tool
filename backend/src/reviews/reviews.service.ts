import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Model, Types } from 'mongoose';
import {
  Review,
  ReviewDocument,
  ReviewStatus,
  ChunkStatus,
} from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { GithubService } from '../github/github.service';
import { DiffParser } from '../common/utils/diff-parser.util';
import { ReviewJobData } from './processors/review.processor';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectQueue('review-queue')
    private readonly reviewQueue: Queue<ReviewJobData>,
    private readonly githubService: GithubService,
  ) {}

  async createReview(
    userId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<{ reviewId: string }> {
    const { prUrl } = createReviewDto;

    // 1. Fetch only the PR .diff from GitHub via Octokit
    const { owner, repo, prNumber, diff } =
      await this.githubService.getPullRequestDiff(userId, prUrl);

    if (!diff || !diff.trim()) {
      throw new BadRequestException(
        'The PR diff is empty or contains no detectable changes.',
      );
    }

    // 2. Parse and chunk the diff
    const chunks = DiffParser.parse(diff);
    if (chunks.length === 0) {
      throw new BadRequestException(
        'Failed to extract file chunks from PR diff.',
      );
    }

    // 3. Initialize Review record in MongoDB
    const initialChunks = chunks.map((c) => ({
      fileName: c.fileName,
      status: ChunkStatus.PENDING,
      issues: [],
    }));

    const review = await this.reviewModel.create({
      userId: new Types.ObjectId(userId),
      repoName: `${owner}/${repo}`,
      prNumber,
      prUrl,
      status: ReviewStatus.PENDING,
      chunks: initialChunks,
      secretsFound: [],
    });

    const reviewId = review._id.toString();

    // 4. Queue one BullMQ job per chunk for async processing
    const jobs = chunks.map((chunk, index) => ({
      name: `review-${reviewId}-chunk-${index}`,
      data: {
        reviewId,
        chunkIndex: index,
        fileName: chunk.fileName,
        diff: chunk.diff,
        validLineNumbers: chunk.validLineNumbers,
        totalChunks: chunks.length,
      },
      opts: {
        attempts: 2,
        backoff: { type: 'exponential', delay: 1000 },
      },
    }));

    await this.reviewQueue.addBulk(jobs);

    return { reviewId };
  }

  async getReviewById(userId: string, reviewId: string): Promise<any> {
    if (!Types.ObjectId.isValid(reviewId)) {
      throw new BadRequestException('Invalid review ID format');
    }

    const cacheKey = `review:${reviewId}:${userId}`;

    // 1. Check Redis Cache
    try {
      const queueAny = this.reviewQueue as any;
      const client =
        typeof queueAny.client?.then === 'function'
          ? await queueAny.client
          : queueAny.client || queueAny.opts?.connection;

      if (client && typeof client.get === 'function') {
        const cached = await client.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      this.logger.warn(
        `Redis cache read failed for key ${cacheKey}: ${(err as Error).message}`,
      );
    }

    // 2. Query MongoDB
    const review = await this.reviewModel.findOne({
      _id: new Types.ObjectId(reviewId),
      userId: new Types.ObjectId(userId),
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // 3. Cache completed or failed immutable results (TTL: 1 hour)
    if (
      review.status === ReviewStatus.COMPLETED ||
      review.status === ReviewStatus.FAILED
    ) {
      try {
        const queueAny = this.reviewQueue as any;
        const client =
          typeof queueAny.client?.then === 'function'
            ? await queueAny.client
            : queueAny.client || queueAny.opts?.connection;

        if (client && typeof client.set === 'function') {
          await client.set(cacheKey, JSON.stringify(review), 'EX', 3600);
        }
      } catch (err) {
        this.logger.warn(
          `Redis cache write failed for key ${cacheKey}: ${(err as Error).message}`,
        );
      }
    }

    return review;
  }

  async getUserReviews(userId: string): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }
}
