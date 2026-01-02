import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { User, ReputationTier } from '../../../common/types/database.types';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
    constructor(
        private readonly supabaseService: SupabaseService,
    ) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async findById(id: string): Promise<User> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            throw new NotFoundException('User not found');
        }

        return data as User;
    }

    async findByEmail(email: string): Promise<User | null> {
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) return null;
        return data as User;
    }

    async findByWallet(chain: string, address: string): Promise<User | null> {


        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq(`walletAddresses->>${chain}`, address)
            .single();

        if (error) return null;
        return data as User;
    }

    async findByWalletAddress(address: string, chain?: string): Promise<User | null> {
        let query = this.supabase.from('users').select('*');

        if (chain) {

            query = query.eq(`walletAddresses->>${chain}`, address);
        } else {



            const commonChains = ['evm', 'ethereum', 'polygon', 'arbitrum', 'optimism', 'base', 'bsc', 'avalanche', 'aptos', 'flow', 'mantle', 'mantleSepolia'];
            const conditions = commonChains.map(c => `walletAddresses->>${c}.eq.${address}`).join(',');
            query = query.or(conditions);
        }

        const { data, error } = await query.maybeSingle();

        if (error || !data) return null;
        return data as User;
    }

    async createFromWallet(walletAddress: string): Promise<User> {
        const newUser = {
            email: `wallet-${walletAddress.slice(0, 6)}-${Date.now()}@lynq.local`,
            walletAddresses: {
                ethereum: walletAddress,
            },
            reputationPoints: 0,
            reputationTier: 'BRONZE',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const { data, error } = await this.supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create user: ${error.message}`);
        }
        return data as User;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {

        const { kycVerified, reputationPoints, reputationTier, id: _id, email, ...updateData } = updateUserDto as any;

        const { data, error } = await this.supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new NotFoundException(`User not found or update failed: ${error.message}`);
        }
        return data as User;
    }


    async updateReputationPoints(userId: string, points: number): Promise<User> {
        const user = await this.findById(userId);
        let newPoints = (user.reputationPoints || 0) + points;
        let newTier = user.reputationTier;

        if (newPoints >= 1000 && newTier === ReputationTier.BRONZE) {
            newTier = ReputationTier.SILVER;
        } else if (newPoints >= 5000 && newTier === ReputationTier.SILVER) {
            newTier = ReputationTier.GOLD;
        } else if (newPoints >= 15000 && newTier === ReputationTier.GOLD) {
            newTier = ReputationTier.PLATINUM;
        }

        const { data, error } = await this.supabase
            .from('users')
            .update({ reputationPoints: newPoints, reputationTier: newTier })
            .eq('id', userId)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update reputation: ${error.message}`);
        }

        return data as User;
    }
}
