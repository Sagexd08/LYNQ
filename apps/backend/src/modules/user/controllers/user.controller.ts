import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    async getProfile(@Request() req: any): Promise<any> {
        return this.userService.findById(req.user.id);
    }

    @Put('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    async updateProfile(@Request() req: any, @Body() updateUserDto: UpdateUserDto): Promise<any> {
        return this.userService.update(req.user.id, updateUserDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get user by ID' })
    async getUserById(@Param('id') id: string): Promise<any> {
        return this.userService.findById(id);
    }
}
