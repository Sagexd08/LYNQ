import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EducationService } from './education.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@ApiTags('Education')
@Controller('education')
export class EducationController {
    constructor(private readonly educationService: EducationService) { }

    @Get('modules')
    @ApiOperation({ summary: 'List all learning modules' })
    async listModules() {
        return this.educationService.listModules();
    }

    @Post('modules/:id/start')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Start a learning module' })
    async startModule(@Request() req: any, @Param('id') moduleId: string) {
        return this.educationService.startModule(req.user.id, moduleId);
    }

    @Post('modules/:id/quiz')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Submit quiz for a module' })
    async submitQuiz(@Request() req: any, @Param('id') moduleId: string, @Body() dto: SubmitQuizDto) {
        return this.educationService.submitQuiz(req.user.id, moduleId, dto.answers);
    }
}
