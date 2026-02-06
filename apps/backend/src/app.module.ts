import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ApplicationsModule } from "./applications/applications.module";
import { LLMModule } from "./llm/llm.module";
import { User } from "./users/entities/user.entity";
import { UserProfile } from "./users/entities/user-profile.entity";
import { Application } from "./applications/entities/application.entity";
import { FieldMappingCache } from "./llm/entities/field-mapping-cache.entity";
import { CustomAnswer } from "./llm/entities/custom-answer.entity";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: "postgres",
        url: configService.get<string>("DATABASE_URL"),
        entities: [User, UserProfile, Application, FieldMappingCache, CustomAnswer],
        synchronize: true, // Auto-create tables (dev only)
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ApplicationsModule,
    LLMModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
