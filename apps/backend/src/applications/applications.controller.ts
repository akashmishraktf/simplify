import { Controller, Get, Post, Put, Delete, UseGuards, Request, Body, Param } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ApplicationsService } from "./applications.service";

@Controller("v1/applications")
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createApplication(@Request() req, @Body() applicationData: any) {
    return this.applicationsService.create(req.user.userId, applicationData);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getApplications(@Request() req) {
    return this.applicationsService.findByUser(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id/status")
  async updateStatus(@Request() req, @Param("id") id: string, @Body() body: { status: string }) {
    return this.applicationsService.updateStatus(id, req.user.userId, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async deleteApplication(@Request() req, @Param("id") id: string) {
    await this.applicationsService.delete(id, req.user.userId);
    return { message: "Application deleted" };
  }
}
