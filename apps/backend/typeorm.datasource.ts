import 'dotenv/config';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from './src/config/database.config';

const dataSource = new DataSource(buildTypeOrmOptions(process.env));

export default dataSource;
