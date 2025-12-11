import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("field_mapping_cache")
export class FieldMappingCache {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  pageSignature: string;

  @Column()
  url: string;

  @Column({ type: "jsonb" })
  mappings: any;

  @Column({ default: 0 })
  useCount: number;

  @Column({ type: "float", default: 0 })
  confirmationRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
