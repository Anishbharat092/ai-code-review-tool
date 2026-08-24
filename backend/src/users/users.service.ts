import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(
    name: string,
    email: string,
    passwordHash: string,
  ): Promise<UserDocument> {
    const user = new this.userModel({
      name,
      email,
      passwordHash,
    });

    return user.save();
  }

  async updateRefreshTokenHash(
    userId: string,
    refreshTokenHash: string | null,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        refreshTokenHash,
      })
      .exec();
  }

  async updateGithubCredentials(
    userId: string,
    githubAccessTokenEncrypted: string,
    githubUsername: string,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      githubAccessTokenEncrypted,
      githubUsername,
    });
  }
}
