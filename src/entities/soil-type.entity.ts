import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Like } from './like.entity';
import { User } from './user.entity';

export type SoilTypeStatus = 'draft' | 'published' | 'deleted';

@Entity('soil_types')
export class SoilType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 500, default: '' })
  shortDescription: string;

  @Column({ type: 'text', default: '' })
  fullDescription: string;

  @Column({ type: 'varchar', length: 20, default: 'draft' })
  status: SoilTypeStatus;

  @Column({ type: 'varchar', length: 255, default: '' })
  imageUrl: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  videoUrl: string;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  looseningFactor: number;

  @Column({ type: 'numeric', precision: 4, scale: 2, nullable: true })
  density: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  formedAt: Date | null;

  @Column({ type: 'int' })
  creatorId: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  @OneToMany(() => Like, (like) => like.soilType)
  likes: Like[];

  likesCount: number;
}
