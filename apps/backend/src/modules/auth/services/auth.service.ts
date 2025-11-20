import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import * as bcrypt from 'bcrypt';
import { User, ReputationTier } from '../../user/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { WalletConnectDto } from '../dto/wallet-connect.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ access_token: string; user: any }> {
    const { email, password, walletAddress } = registerDto;

    const existingUser = await this.userRepository.findOne({
      where: [{ email }, ...(walletAddress ? [{ walletAddresses: { evm: walletAddress } }] : [])],
    });

    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      walletAddresses: walletAddress ? { evm: walletAddress } : {},
      reputationTier: ReputationTier.BRONZE,
      reputationPoints: 0,
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    delete user.password;

    return { access_token, user };
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const access_token = this.jwtService.sign(payload);

    delete user.password;

    return { access_token, user };
  }

  async walletConnect(walletConnectDto: WalletConnectDto): Promise<{ access_token: string; user: any }> {
    const { walletAddress, signature, message, chain } = walletConnectDto;

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new UnauthorizedException('Invalid signature');
      }

      let user = await this.userRepository.findOne({
        where: { walletAddresses: { [chain]: walletAddress } },
      });

      if (!user) {
        user = this.userRepository.create({
          email: `${walletAddress.substring(0, 8)}@wallet.lynq`,
          walletAddresses: { [chain]: walletAddress },
          reputationTier: ReputationTier.BRONZE,
          reputationPoints: 0,
        });
        await this.userRepository.save(user);
      }

      const payload = { sub: user.id, wallet: walletAddress };
      const access_token = this.jwtService.sign(payload);

      delete user.password;

      return { access_token, user };
    } catch (error) {
      throw new UnauthorizedException('Wallet authentication failed');
    }
  }

  async validateUser(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { id: userId } });
  }
}
