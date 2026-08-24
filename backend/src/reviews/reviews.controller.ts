import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard';

@Controller('reviews')
@UseGuards(JwtAccessGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // Max 5 reviews submitted per minute
  async createReview(
    @Req() req: Request,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const user = req.user as any;
    const userId = user?.sub || user?.userId || user?.id;
    return this.reviewsService.createReview(userId, createReviewDto);
  }

  @Get(':id')
  async getReview(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    const userId = user?.sub || user?.userId || user?.id;
    return this.reviewsService.getReviewById(userId, id);
  }

  @Get()
  async getUserReviews(@Req() req: Request) {
    const user = req.user as any;
    const userId = user?.sub || user?.userId || user?.id;
    return this.reviewsService.getUserReviews(userId);
  }
}
