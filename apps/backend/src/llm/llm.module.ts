import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LLMService } from "./llm.service";
import { AgentService } from "./agent.service";
import { LLMController } from "./llm.controller";
import { FieldMappingCache } from "./entities/field-mapping-cache.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMappingCache]),
    forwardRef(() => UsersModule),
  ],
  providers: [LLMService, AgentService],
  controllers: [LLMController],
  exports: [LLMService, AgentService],
})
export class LLMModule {}
