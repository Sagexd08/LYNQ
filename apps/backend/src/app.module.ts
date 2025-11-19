import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { LoanModule } from './modules/loan/loan.module';
import { CollateralModule } from './modules/collateral/collateral.module';
import { MLModule } from './modules/ml/ml.module';
import { User } from './modules/user/entities/user.entity';
import { Loan } from './modules/loan/entities/loan.entity';
import { Collateral } from './modules/collateral/entities/collateral.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'lynq',
      entities: [User, Loan, Collateral],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UserModule,
    LoanModule,
    CollateralModule,
    MLModule,
  ],
})
export class AppModule {}
