import { Controller, Get, Put, Post, UseGuards, Request, Body } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UsersService } from "./users.service";

@Controller("v1/profile")
export class ProfileController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getProfile(@Request() req) {
    const profile = await this.usersService.getOrCreateProfile(req.user.userId);
    return {
      email: req.user.email,
      ...profile,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put()
  async updateProfile(@Request() req, @Body() profileData: any) {
    const profile = await this.usersService.updateProfile(
      req.user.userId,
      profileData
    );
    return profile;
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrUpdateProfile(@Request() req, @Body() profileData: any) {
    const profile = await this.usersService.updateProfile(
      req.user.userId,
      profileData
    );
    return profile;
  }
}
