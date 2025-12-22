import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { User, ReputationTier } from '../entities/user.entity';
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
        // Find user by wallet address on specific chain
        // Since walletAddresses is a jsonb column, we use the arrow operator
        const { data, error } = await this.supabase
            .from('users')
            .select('*')
            .eq(`walletAddresses->>${chain}`, address)
            .single();

        if (error) return null;
        return data as User;
    }

    async findByWalletAddress(address: string): Promise<User | null> {
        // This is tricky with JSONB if we don't know the key. 
        // We might need to select all and filter in memory if the schema is dynamic
        // Or search specific known chains.
        // For now, let's try a common heuristic or fetch all (inefficient but safe for small scale)
        const { data: users, error } = await this.supabase
            .from('users')
            .select('*');

        if (error || !users) return null;

        for (const user of users) {
            const u = user as User;
            if (u.walletAddresses) {
                for (const chain in u.walletAddresses) {
                    if (u.walletAddresses[chain]?.toLowerCase() === address.toLowerCase()) {
                        return u;
                    }
                }
            }
        }
        return null;
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
        const { data, error } = await this.supabase
            .from('users')
            .update(updateUserDto)
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
