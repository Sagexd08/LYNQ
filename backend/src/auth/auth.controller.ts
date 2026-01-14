import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import {
  WalletChallengeDto,
  WalletChallengeResponseDto,
} from './dto/wallet-challenge.dto';
import { WalletVerifyDto } from './dto/wallet-verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wallet/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a challenge nonce for wallet authentication',
  })
  @ApiResponse({
    status: 200,
    description: 'Challenge generated successfully',
    type: WalletChallengeResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid wallet address' })
  async requestChallenge(
    @Body() dto: WalletChallengeDto,
  ): Promise<WalletChallengeResponseDto> {
    return this.authService.generateChallenge(dto.walletAddress);
  }

  @Post('wallet/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify wallet signature and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Invalid signature or nonce' })
  async verifySignature(@Body() dto: WalletVerifyDto): Promise<AuthResponse> {
    return this.authService.verifySignature(
      dto.walletAddress,
      dto.signature,
      dto.nonce,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getProfile(user.id);
  }
}
