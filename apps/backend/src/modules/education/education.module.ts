import { Module } from '@nestjs/common';
import { EducationController } from './education.controller';
import { EducationService } from './education.service';
import { UserModule } from '../user/user.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
    imports: [UserModule, SupabaseModule],
    controllers: [EducationController],
    providers: [EducationService],
    exports: [EducationService],
})
export class EducationModule { }
