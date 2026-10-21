import { MigrationInterface, QueryRunner } from 'typeorm';
import { hash } from 'bcryptjs';

export class UserPasswords1792200000001 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const users: { id: number; password: string }[] = await queryRunner.query('SELECT id, password FROM users');
    for (const user of users) {
      if (!/^\$2[aby]\$/.test(user.password)) {
        await queryRunner.query('UPDATE users SET password = $1 WHERE id = $2', [await hash(user.password, 12), user.id]);
      }
    }
    await queryRunner.query('CREATE UNIQUE INDEX users_login_unique ON users (login)');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX users_login_unique');
  }
}
