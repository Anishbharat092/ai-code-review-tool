import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { Review, ReviewSchema } from './schemas/review.schema';
import { GithubModule } from '../github/github.module';
import { GeminiService } from './services/gemini.service';
import { ReviewProcessor } from './processors/review.processor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    BullModule.registerQueue({
      name: 'review-queue',
    }),
    GithubModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, GeminiService, ReviewProcessor],
  exports: [ReviewsService],
})
export class ReviewsModule {}
