import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LLMService } from "./llm.service";
import { AgentService } from "./agent.service";
import { QABankService } from "./qa-bank.service";
import { LLMController } from "./llm.controller";
import { FieldMappingCache } from "./entities/field-mapping-cache.entity";
import { CustomAnswer } from "./entities/custom-answer.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FieldMappingCache, CustomAnswer]),
    forwardRef(() => UsersModule),
  ],
  providers: [LLMService, AgentService, QABankService],
  controllers: [LLMController],
  exports: [LLMService, AgentService, QABankService],
})
export class LLMModule {}
