import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { extname } from 'path';
import * as Minio from 'minio';

@Injectable()
export class MinioService {
  private readonly client: Minio.Client;
  private readonly bucket: string;
  private readonly baseUrl: string;

  constructor(config: ConfigService) {
    const endPoint = config.get<string>('MINIO_ENDPOINT')!;
    const port = Number(config.get('MINIO_PORT'));
    const useSSL = config.get('MINIO_USE_SSL') === 'true';

    this.bucket = config.get<string>('MINIO_BUCKET')!;
    this.baseUrl = `${useSSL ? 'https' : 'http'}://${endPoint}:${port}/${this.bucket}`;
    this.client = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey: config.get<string>('MINIO_ACCESS_KEY')!,
      secretKey: config.get<string>('MINIO_SECRET_KEY')!,
    });
  }

  async upload(file: Express.Multer.File, prefix: string): Promise<string> {
    const fileName = `${prefix}-${Date.now()}${extname(file.originalname).toLowerCase()}`;

    await this.client.putObject(this.bucket, fileName, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    return `${this.baseUrl}/${fileName}`;
  }
}
