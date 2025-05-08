import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: join(process.cwd(), 'data', 'whatsapp.sqlite'),
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  synchronize: true, // Apenas em desenvolvimento
  logging: true,
};