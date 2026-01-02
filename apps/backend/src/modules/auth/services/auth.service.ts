import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../../supabase/supabase.service';
import { ethers } from 'ethers';
import * as bcrypt from 'bcrypt';
import { User, ReputationTier } from '../../../common/types/database.types';
import { UserService } from '../../user/services/user.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { WalletConnectDto } from '../dto/wallet-connect.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly jwtService: JwtService,
        private readonly supabaseService: SupabaseService,
    ) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

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

        const newUser = {
            email,
            password: hashedPassword,
            walletAddresses: walletAddress ? { evm: walletAddress } : {},
            reputationTier: ReputationTier.BRONZE,
            reputationPoints: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const { data: user, error } = await this.supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (error || !user) {
            throw new Error(`Registration failed: ${error?.message}`);
        }

        const payload = { sub: user.id, email: user.email };
        const access_token = this.jwtService.sign(payload);

        
        const { password: _pwd, ...result } = user;
        return { access_token, user: result };
    }

    async login(loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
        const { email, password } = loginDto;

        
        
        const { data: userWithPassword, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !userWithPassword || !userWithPassword.password || !(await bcrypt.compare(password, userWithPassword.password as string))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: userWithPassword.id, email: userWithPassword.email };
        const access_token = this.jwtService.sign(payload);

        const { password: _p, ...result } = userWithPassword;

        return { access_token, user: result };
    }

    async walletConnect(walletConnectDto: WalletConnectDto): Promise<{ access_token: string; user: any }> {
        const { walletAddress, signature, message, chain } = walletConnectDto;

        try {
            const recoveredAddress = ethers.verifyMessage(message, signature);

            if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
                throw new UnauthorizedException('Invalid signature');
            }

            
            let user = await this.userService.findByWalletAddress(walletAddress, chain);

            if (!user) {
                const newUser = {
                    email: `${walletAddress.substring(0, 8)}@wallet.lynq`,
                    walletAddresses: { [chain]: walletAddress },
                    reputationTier: ReputationTier.BRONZE,
                    reputationPoints: 0,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const { data, error } = await this.supabase
                    .from('users')
                    .insert(newUser)
                    .select()
                    .single();

                if (error) throw error;
                user = data as User;
            }

            const payload = { sub: user.id, wallet: walletAddress };
            const access_token = this.jwtService.sign(payload);

            const { password: _pwd, ...result } = user;

            return { access_token, user: result };
        } catch (error) {
            throw new UnauthorizedException('Wallet authentication failed');
        }
    }

    async validateUser(userId: string): Promise<User | null> {
        return this.userService.findById(userId);
    }
}
