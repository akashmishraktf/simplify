import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("custom_answers")
export class CustomAnswer {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @Column({ type: "text" })
  questionText: string;

  @Column({ type: "text" })
  answerText: string;

  // Store embedding as a JSON array of floats for semantic search
  // PostgreSQL pgvector would be ideal, but jsonb works for moderate scale
  @Column({ type: "jsonb", nullable: true })
  questionEmbedding: number[];

  @Column({ type: "jsonb", nullable: true, default: [] })
  tags: string[];

  @Column({ default: 0 })
  useCount: number;

  @Column({ type: "timestamp", nullable: true })
  lastUsedAt: Date;

  // Whether this answer was auto-saved from an AI generation
  @Column({ default: false })
  autoSaved: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

