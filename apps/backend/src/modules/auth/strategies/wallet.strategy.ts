import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ethers } from 'ethers';

@Injectable()
export class WalletStrategy extends PassportStrategy(Strategy, 'wallet') {
  async validate(req: any): Promise<any> {
    const { signature, message, walletAddress } = req.body;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return null;
    }
    
    return { walletAddress, chain: req.body.chain || 'evm' };
  }
}
