import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  login: string;

  @Column({ type: 'varchar', length: 100, select: false })
  password: string;

  @Column({ type: 'boolean', default: false })
  isModerator: boolean;
}
