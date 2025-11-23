import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReputationService } from './reputation.service';
import { ReputationController } from './reputation.controller';
import { Vouch } from './entities/vouch.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vouch])],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
