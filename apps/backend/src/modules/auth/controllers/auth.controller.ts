import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { WalletConnectDto } from '../dto/wallet-connect.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  async register(@Body() registerDto: RegisterDto): Promise<{ access_token: string; user: any }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login with email/password' })
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string; user: any }> {
    return this.authService.login(loginDto);
  }

  @Post('wallet-connect')
  @ApiOperation({ summary: 'Authenticate with wallet signature' })
  async walletConnect(@Body() walletConnectDto: WalletConnectDto): Promise<{ access_token: string; user: any }> {
    return this.authService.walletConnect(walletConnectDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any): Promise<any> {
    return req.user;
  }
}
