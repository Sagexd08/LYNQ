import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

export const buildTypeOrmOptions = (env: Record<string, string | undefined>): DataSourceOptions => {
    const nodeEnv = env.NODE_ENV || 'development';
    const isTest = nodeEnv === 'test';
    const isDev = nodeEnv === 'development';

    if (isTest) {
        return {
            type: 'sqlite',
            database: ':memory:',
            synchronize: true,
            entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
            logging: false,
        } satisfies DataSourceOptions;
    }

    return {
        type: 'postgres',
        host: env.DB_HOST || 'localhost',
        port: Number(env.DB_PORT) || 5432,
        username: env.DB_USER || 'postgres',
        password: env.DB_PASSWORD || 'postgres',
        database: env.DB_NAME || 'lynq',
        entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
        migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
        synchronize: isDev,
        migrationsRun: !isDev,
        logging: nodeEnv !== 'test',
    } satisfies DataSourceOptions;
};

export const typeormEntitiesGlob = join(__dirname, '..', '**', '*.entity.{ts,js}');