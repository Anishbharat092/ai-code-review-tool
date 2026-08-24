import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq'; // 1. Added InjectQueue here
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job, Queue } from 'bullmq'; // 2. Added Queue type here
import { Model, Types } from 'mongoose';
import { GeminiService } from '../services/gemini.service';
import {
  ChunkStatus,
  Review,
  ReviewDocument,
  ReviewStatus,
} from '../schemas/review.schema';

export interface ReviewJobData {
  reviewId: string;
  chunkIndex: number;
  fileName: string;
  diff: string;
  validLineNumbers: number[];
  totalChunks: number;
}

@Processor('review-queue')
export class ReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(ReviewProcessor.name);

  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    private readonly geminiService: GeminiService,
    @InjectQueue('review-queue') private readonly reviewQueue: Queue, // 3. Injected the queue here
  ) {
    super();
  }

  async process(job: Job<ReviewJobData>): Promise<void> {
    const {
      reviewId,
      chunkIndex,
      fileName,
      diff,
      validLineNumbers,
      totalChunks,
    } = job.data;

    this.logger.log(
      `Processing chunk ${chunkIndex + 1}/${totalChunks} for Review ${reviewId} (${fileName})`,
    );

    try {
      // 1. Analyze chunk with Gemini
      const analysis = await this.geminiService.reviewChunk(
        fileName,
        diff,
        validLineNumbers,
      );

      // 2. Update chunk in MongoDB
      const updateQuery: Record<string, any> = {
        [`chunks.${chunkIndex}.status`]: ChunkStatus.EVALUATED,
        [`chunks.${chunkIndex}.issues`]: analysis.issues,
        status: ReviewStatus.PROCESSING,
      };

      await this.reviewModel.findByIdAndUpdate(reviewId, {
        $set: updateQuery,
      });

      // 3. Check if all chunks are finished
      await this.checkAndFinalizeReview(reviewId, totalChunks);
    } catch (error) {
      this.logger.error(
        `Failed processing chunk ${chunkIndex} for review ${reviewId}: ${(error as Error).message}`,
      );

      await this.reviewModel.findByIdAndUpdate(reviewId, {
        $set: {
          [`chunks.${chunkIndex}.status`]: ChunkStatus.FAILED,
        },
      });

      await this.checkAndFinalizeReview(reviewId, totalChunks);
    }
  }

  private async checkAndFinalizeReview(
    reviewId: string,
    totalChunks: number,
  ): Promise<void> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) return;

    const finishedChunks = review.chunks.filter(
      (c) =>
        c.status === ChunkStatus.EVALUATED || c.status === ChunkStatus.FAILED,
    );

    if (finishedChunks.length >= totalChunks) {
      const allFailed = review.chunks.every(
        (c) => c.status === ChunkStatus.FAILED,
      );
      const finalStatus = allFailed
        ? ReviewStatus.FAILED
        : ReviewStatus.COMPLETED;

      await this.reviewModel.findByIdAndUpdate(reviewId, {
        $set: {
          status: finalStatus,
          completedAt: new Date(),
          overallSummary:
            finalStatus === ReviewStatus.COMPLETED
              ? `Review completed across ${totalChunks} chunk(s).`
              : 'Review failed during chunk processing.',
        },
      });

      this.logger.log(`Review ${reviewId} marked as ${finalStatus}`);

      // Fixed: BullMQ client resolution
      // Safely clear Redis cache if client is available
      try {
        const queueAny = this.reviewQueue as any;
        const client =
          typeof queueAny.client?.then === 'function'
            ? await queueAny.client
            : queueAny.client || queueAny.opts?.connection;

        if (client && typeof client.del === 'function') {
          await client.del(`review:${reviewId}:${review.userId.toString()}`);
          this.logger.log(`Cleared Redis cache key for review ${reviewId}`);
        }
      } catch (cacheError) {
        this.logger.warn(
          `Redis cache invalidation skipped for review ${reviewId}: ${(cacheError as Error).message}`,
        );
      }
    }
  }
}
