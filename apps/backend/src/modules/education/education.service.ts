import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UserService } from '../user/services/user.service';
import { LearningModule, LearningProgress } from '../../common/types/database.types';

@Injectable()
export class EducationService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly userService: UserService
    ) { }

    private get supabase() {
        return this.supabaseService.getClient();
    }

    async listModules(): Promise<LearningModule[]> {
        const { data } = await this.supabase.from('learning_modules').select('*').order('created_at');
        return (data || []) as LearningModule[];
    }

    async startModule(userId: string, moduleId: string) {
        const { data: existing } = await this.supabase
            .from('learning_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('module_id', moduleId)
            .maybeSingle();

        if (existing) return existing;

        const { data, error } = await this.supabase
            .from('learning_progress')
            .insert({ user_id: userId, module_id: moduleId, status: 'STARTED' })
            .select()
            .single();

        if (error) throw new Error(error.message);
        return data;
    }

    async submitQuiz(userId: string, moduleId: string, answers: Record<string, any>) {
        
        const passed = Object.keys(answers).length > 0;
        const score = passed ? 100 : 0;

        await this.supabase.from('quiz_attempts').insert({
            user_id: userId,
            module_id: moduleId,
            answers,
            score,
            passed
        });

        if (passed) {
            const { data: moduleData } = await this.supabase.from('learning_modules').select('*').eq('id', moduleId).single();
            if (!moduleData) throw new NotFoundException('Module not found');

            
            await this.supabase
                .from('learning_progress')
                .upsert({
                    user_id: userId,
                    module_id: moduleId,
                    status: 'COMPLETED',
                    score,
                    completed_at: new Date()
                }, { onConflict: 'user_id,module_id' });

            await this.userService.updateReputationPoints(userId, moduleData.points_reward);

            return { success: true, pointsAwarded: moduleData.points_reward, passed: true };
        }

        return { success: true, passed: false, message: 'Quiz failed, try again.' };
    }
}
