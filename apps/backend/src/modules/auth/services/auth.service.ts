import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import * as bcrypt from 'bcrypt';
import { User, ReputationTier } from '../../user/entities/user.entity';
import { UserService } from '../../user/services/user.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { WalletConnectDto } from '../dto/wallet-connect.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ access_token: string; user: any }> {
        const { email, password, walletAddress } = registerDto;

        const existingEmail = await this.userService.findByEmail(email);
        if (existingEmail) {
            throw new UnauthorizedException('User already exists');
        }

        if (walletAddress) {
            const existingWallet = await this.userService.findByWalletAddress(walletAddress);
            if (existingWallet) {
                throw new UnauthorizedException('Wallet associated with another user');
            }
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

        // Remove password from response
        const { password: _, ...result } = user;
        return { access_token, user: result };
    }

    async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
        const { email, password } = loginDto;

        const user = await this.userService.findByEmail(email);

        // Passwords are not selected by default in the new entity logic?
        // Wait, in legacy entity: @Column({ nullable: true, select: false }) password?: string;
        // So findByEmail won't return password.

        // We need to explicitly select password for login check.
        const userWithPassword = await this.userRepository.createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.email = :email", { email })
            .getOne();

        if (!userWithPassword || !userWithPassword.password || !(await bcrypt.compare(password, userWithPassword.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: userWithPassword.id, email: userWithPassword.email };
        const access_token = this.jwtService.sign(payload);

        const { password: _, ...result } = userWithPassword;

        return { access_token, user: result };
    }

    async walletConnect(walletConnectDto: WalletConnectDto): Promise<{ access_token: string; user: any }> {
        const { walletAddress, signature, message, chain } = walletConnectDto;

        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new UnauthorizedException('Invalid signature');
            }

            // Use safe lookup suited for SQLite/Postgres hybrid
            let user = await this.userService.findByWalletAddress(walletAddress);

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

            const { password: _, ...result } = user;

            return { access_token, user: result };
        } catch (error) {
            throw new UnauthorizedException('Wallet authentication failed');
        }
    }

    async validateUser(userId: string): Promise<User | null> {
        return this.userService.findById(userId);
    }
}
