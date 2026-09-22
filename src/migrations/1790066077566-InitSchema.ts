import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1790066077566 implements MigrationInterface {
    name = 'InitSchema1790066077566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "login" character varying(50) NOT NULL, "password" character varying(100) NOT NULL, "isModerator" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "soil_types" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "shortDescription" character varying(500) NOT NULL DEFAULT '', "fullDescription" text NOT NULL DEFAULT '', "status" character varying(20) NOT NULL DEFAULT 'draft', "imageUrl" character varying(255) NOT NULL DEFAULT '', "videoUrl" character varying(255) NOT NULL DEFAULT '', "looseningFactor" numeric(4,2), "density" numeric(4,2), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "formedAt" TIMESTAMP, "creatorId" integer NOT NULL, CONSTRAINT "PK_398a557a37d38707814a2d8254b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "likes" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "soilTypeId" integer NOT NULL, CONSTRAINT "PK_a9323de3f8bced7539a794b4a37" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "soil_types" ADD CONSTRAINT "FK_f7f16354c894e21be4fbec153c6" FOREIGN KEY ("creatorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "likes" ADD CONSTRAINT "FK_26511297098ef1da989279fff0e" FOREIGN KEY ("soilTypeId") REFERENCES "soil_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_26511297098ef1da989279fff0e"`);
        await queryRunner.query(`ALTER TABLE "likes" DROP CONSTRAINT "FK_cfd8e81fac09d7339a32e57d904"`);
        await queryRunner.query(`ALTER TABLE "soil_types" DROP CONSTRAINT "FK_f7f16354c894e21be4fbec153c6"`);
        await queryRunner.query(`DROP TABLE "likes"`);
        await queryRunner.query(`DROP TABLE "soil_types"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
