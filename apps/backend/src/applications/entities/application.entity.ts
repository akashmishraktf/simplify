import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("applications")
export class Application {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ nullable: true })
  jobTitle: string;

  @Column({ nullable: true })
  company: string;

  @Column()
  url: string;

  @CreateDateColumn({ name: "date_applied" })
  dateApplied: Date;

  @Column({ default: "applied" })
  status: string; // applied, interviewing, rejected, accepted

  @Column({ type: "jsonb", nullable: true })
  metadata: any;
}
