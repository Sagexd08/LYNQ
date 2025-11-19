import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { WalletStrategy } from './strategies/wallet.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { WalletAuthGuard } from './guards/wallet-auth.guard';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'lynq-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, WalletStrategy, JwtAuthGuard, WalletAuthGuard],
  exports: [AuthService, JwtAuthGuard, WalletAuthGuard],
})
export class AuthModule {}
