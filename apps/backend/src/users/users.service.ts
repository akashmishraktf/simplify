import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>
  ) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(email: string, passwordHash: string): Promise<User> {
    const user = this.usersRepository.create({ email, passwordHash });
    return this.usersRepository.save(user);
  }

  async getOrCreateProfile(userId: string): Promise<UserProfile> {
    let profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      profile = this.userProfileRepository.create({ userId });
      profile = await this.userProfileRepository.save(profile);
    }

    return profile;
  }

  async updateProfile(
    userId: string,
    profileData: Partial<UserProfile>
  ): Promise<UserProfile> {
    let profile = await this.getOrCreateProfile(userId);

    Object.assign(profile, profileData);
    return this.userProfileRepository.save(profile);
  }

  async getProfile(userId: string): Promise<(UserProfile & { email?: string }) | null> {
    const profile = await this.userProfileRepository.findOne({
      where: { userId },
    });

    if (!profile) {
      return null;
    }

    // Get user to include email
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    return {
      ...profile,
      email: user?.email,
    };
  }
}
