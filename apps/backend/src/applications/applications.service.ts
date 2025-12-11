import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Application } from "./entities/application.entity";

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationsRepository: Repository<Application>
  ) {}

  async create(userId: string, applicationData: Partial<Application>): Promise<Application> {
    const application = this.applicationsRepository.create({
      userId,
      ...applicationData,
    });
    return this.applicationsRepository.save(application);
  }

  async findByUser(userId: string): Promise<Application[]> {
    return this.applicationsRepository.find({
      where: { userId },
      order: { dateApplied: "DESC" },
    });
  }

  async findById(id: string, userId: string): Promise<Application | undefined> {
    return this.applicationsRepository.findOne({
      where: { id, userId },
    });
  }

  async updateStatus(id: string, userId: string, status: string): Promise<Application> {
    const application = await this.findById(id, userId);
    if (!application) {
      throw new Error("Application not found");
    }
    application.status = status;
    return this.applicationsRepository.save(application);
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.applicationsRepository.delete({ id, userId });
  }
}
