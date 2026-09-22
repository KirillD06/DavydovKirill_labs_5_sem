import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoilType } from './soil-type.entity';
import { User } from './user.entity';

@Entity('likes')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'int' })
  soilTypeId: number;

  @ManyToOne(() => User, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => SoilType, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'soilTypeId' })
  soilType: SoilType;
}
