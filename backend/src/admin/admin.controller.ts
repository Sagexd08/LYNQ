import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  ParseIntPipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id/status')
  setUserStatus(
    @Param('id') id: string,
    @Body('blocked', ParseBoolPipe) blocked: boolean,
  ) {
    return this.adminService.setUserStatus(id, blocked);
  }

  @Patch('reputation/:userId')
  updateReputation(
    @Param('userId') userId: string,
    @Body('score', ParseIntPipe) score: number,
  ) {
    return this.adminService.updateReputation(userId, score);
  }

  @Post('loans/:id/overdue')
  simulateOverdue(@Param('id') id: string) {
    return this.adminService.simulateOverdue(id);
  }
}
