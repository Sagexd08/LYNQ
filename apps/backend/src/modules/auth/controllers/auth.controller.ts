import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { WalletConnectDto } from '../dto/wallet-connect.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @Throttle(5, 60)
    @ApiOperation({ summary: 'Register with email and password' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @Throttle(5, 60)
    @ApiOperation({ summary: 'Login with email and password' })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('wallet-connect')
    @Throttle(5, 60)
    @ApiOperation({ summary: 'Authenticate via Wallet Connect (SIWE-like)' })
    async walletConnect(@Body() walletConnectDto: WalletConnectDto) {
        return this.authService.walletConnect(walletConnectDto);
    }
}
