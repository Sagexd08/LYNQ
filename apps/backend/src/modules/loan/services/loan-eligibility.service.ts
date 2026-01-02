import { Injectable, BadRequestException } from '@nestjs/common';
import { UserService } from '../../user/services/user.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { User, ReputationTier, LearningProgress } from '../../../common/types/database.types';

@Injectable()
export class LoanEligibilityService {
    constructor(
        private readonly userService: UserService,
        private readonly supabaseService: SupabaseService
    ) { }

    async check(userId: string, amount: number): Promise<{ eligible: boolean, message?: string }> {
        const user = await this.userService.findById(userId);
        if (!user) throw new BadRequestException('User not found');

        const amountNum = Number(amount);

        
        const limits: Record<ReputationTier, number> = {
            [ReputationTier.BRONZE]: 1000,
            [ReputationTier.SILVER]: 5000,
            [ReputationTier.GOLD]: 20000,
            [ReputationTier.PLATINUM]: 100000,
        };
        const maxAmount = limits[user.reputationTier] || 1000;

        if (amountNum > maxAmount) {
            return {
                eligible: false,
                message: `Loan amount ${amountNum} exceeds limit for ${user.reputationTier} tier (${maxAmount}). Complete more education modules to level up.`
            };
        }

        
        
        if (user.reputationTier === ReputationTier.BRONZE) {
            const { count, error } = await this.supabaseService.getClient()
                .from('learning_progress')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('status', 'COMPLETED');

            if (error) return { eligible: false, message: 'Failed to check education progress' };

            if ((count || 0) < 1) {
                return { eligible: false, message: 'You must complete at least 1 educational module to unlock borrowing.' };
            }
        }

        return { eligible: true };
    }
}
