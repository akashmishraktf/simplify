import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { User } from "./entities/user.entity";
import { UserProfile } from "./entities/user-profile.entity";
import { ProfileController } from "./profile.controller";

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  providers: [UsersService],
  controllers: [ProfileController],
  exports: [UsersService],
})
export class UsersModule {}
