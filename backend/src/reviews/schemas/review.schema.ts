import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ChunkStatus {
  PENDING = 'pending',
  EVALUATED = 'evaluated',
  FAILED = 'failed',
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  WARNING = 'warning',
  SUGGESTION = 'suggestion',
}

@Schema({ _id: false })
export class ReviewIssue {
  @Prop({ type: String, enum: Object.values(IssueSeverity), required: true })
  severity!: IssueSeverity;

  @Prop({ type: Number, required: true })
  line!: number;

  @Prop({ type: String, required: true })
  message!: string;
}

export const ReviewIssueSchema = SchemaFactory.createForClass(ReviewIssue);

@Schema({ _id: false })
export class ReviewChunk {
  @Prop({ type: String, required: true })
  fileName!: string;

  @Prop({
    type: String,
    enum: Object.values(ChunkStatus),
    default: ChunkStatus.PENDING,
  })
  status!: ChunkStatus;

  @Prop({ type: [ReviewIssueSchema], default: [] })
  issues!: ReviewIssue[];
}

export const ReviewChunkSchema = SchemaFactory.createForClass(ReviewChunk);

@Schema({ _id: false })
export class SecretFound {
  @Prop({ type: String, required: true })
  fileName!: string;

  @Prop({ type: Number, required: true })
  line!: number;

  @Prop({ type: String, required: true })
  type!: string;
}

export const SecretFoundSchema = SchemaFactory.createForClass(SecretFound);

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  repoName!: string;

  @Prop({ type: Number, required: true })
  prNumber!: number;

  @Prop({ type: String, required: true })
  prUrl!: string;

  @Prop({
    type: String,
    enum: Object.values(ReviewStatus),
    default: ReviewStatus.PENDING,
    index: true,
  })
  status!: ReviewStatus;

  @Prop({ type: [ReviewChunkSchema], default: [] })
  chunks!: ReviewChunk[];

  @Prop({ type: [SecretFoundSchema], default: [] })
  secretsFound!: SecretFound[];

  @Prop({ type: String, default: null })
  overallSummary?: string | null;

  @Prop({ type: Date, default: null })
  completedAt?: Date | null;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
