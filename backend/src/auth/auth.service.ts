import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ethers } from 'ethers';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface JwtPayload {
    sub: string;
    walletAddress: string;
    tier: string;
}

export interface AuthResponse {
    accessToken: string;
    profile: {
        id: string;
        walletAddress: string;
        tier: string;
        reputationScore: number;
    };
}

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async generateChallenge(walletAddress: string): Promise<{ nonce: string; message: string }> {
        const normalizedAddress = walletAddress.toLowerCase();
        const nonce = randomUUID();

        await this.prisma.profile.upsert({
            where: { walletAddress: normalizedAddress },
            update: { nonce },
            create: {
                walletAddress: normalizedAddress,
                nonce,
                reputationScore: 50,
                tier: 'BRONZE',
            },
        });

        const message = this.buildSignMessage(normalizedAddress, nonce);

        return { nonce, message };
    }

    async verifySignature(
        walletAddress: string,
        signature: string,
        nonce: string,
    ): Promise<AuthResponse> {
        const normalizedAddress = walletAddress.toLowerCase();

        const profile = await this.prisma.profile.findUnique({
            where: { walletAddress: normalizedAddress },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found. Request a challenge first.');
        }

        if (profile.nonce !== nonce) {
            throw new UnauthorizedException('Invalid or expired nonce');
        }

        const message = this.buildSignMessage(normalizedAddress, nonce);
        const recoveredAddress = this.recoverAddress(message, signature);

        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
            throw new UnauthorizedException('Invalid signature');
        }

        await this.prisma.profile.update({
            where: { id: profile.id },
            data: { nonce: null },
        });

        const payload: JwtPayload = {
            sub: profile.id,
            walletAddress: normalizedAddress,
            tier: profile.tier,
        };

        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            profile: {
                id: profile.id,
                walletAddress: profile.walletAddress,
                tier: profile.tier,
                reputationScore: profile.reputationScore,
            },
        };
    }

    async getProfile(userId: string) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: userId },
            include: {
                loans: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        return profile;
    }

    async validateJwtPayload(payload: JwtPayload) {
        const profile = await this.prisma.profile.findUnique({
            where: { id: payload.sub },
        });

        if (!profile || profile.isBlocked) {
            throw new UnauthorizedException('Invalid or blocked user');
        }

        return profile;
    }

    private buildSignMessage(walletAddress: string, nonce: string): string {
        return `Welcome to LYNQ!

Sign this message to authenticate your wallet.

Wallet: ${walletAddress}
Nonce: ${nonce}

This request will not trigger a blockchain transaction or cost any gas fees.`;
    }

    private recoverAddress(message: string, signature: string): string {
        try {
            return ethers.verifyMessage(message, signature);
        } catch {
            throw new UnauthorizedException('Invalid signature format');
        }
    }
}
