import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class WalletAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { signature, message, walletAddress } = request.body;

    if (!signature || !message || !walletAddress) {
      throw new UnauthorizedException('Missing wallet authentication data');
    }

    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      throw new UnauthorizedException('Invalid wallet signature');
    }
  }
}
