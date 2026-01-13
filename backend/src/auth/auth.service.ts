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

        const existingUser = await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM users 
            WHERE "walletAddresses" @> ${JSON.stringify([normalizedAddress])}::jsonb
            LIMIT 1
        `.then(rows => rows[0] ? this.prisma.user.findUnique({ where: { id: rows[0].id } }) : null);

        if (existingUser) {
            
            const metadata = (existingUser.metadata as any) || {};
            metadata.nonce = nonce;
            await this.prisma.user.update({
                where: { id: existingUser.id },
                data: { metadata },
            });
        } else {
            
            await this.prisma.user.create({
                data: {
                    email: `${normalizedAddress}@wallet.local`, 
                    walletAddresses: [normalizedAddress],
                    reputationTier: 'BRONZE',
                    reputationPoints: 50,
                    metadata: { nonce },
                },
            });
        }

        const message = this.buildSignMessage(normalizedAddress, nonce);

        return { nonce, message };
    }

    async verifySignature(
        walletAddress: string,
        signature: string,
        nonce: string,
    ): Promise<AuthResponse> {
        const normalizedAddress = walletAddress.toLowerCase();

        const userRows = await this.prisma.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM users 
            WHERE "walletAddresses" @> ${JSON.stringify([normalizedAddress])}::jsonb
            LIMIT 1
        `;
        
        if (userRows.length === 0) {
            throw new NotFoundException('User not found. Request a challenge first.');
        }
        
        const user = await this.prisma.user.findUnique({
            where: { id: userRows[0].id },
        });

        if (!user) {
            throw new NotFoundException('User not found. Request a challenge first.');
        }

        const metadata = (user.metadata as any) || {};
        if (metadata.nonce !== nonce) {
            throw new UnauthorizedException('Invalid or expired nonce');
        }

        const message = this.buildSignMessage(normalizedAddress, nonce);
        const recoveredAddress = this.recoverAddress(message, signature);

        if (recoveredAddress.toLowerCase() !== normalizedAddress) {
            throw new UnauthorizedException('Invalid signature');
        }

        delete metadata.nonce;
        await this.prisma.user.update({
            where: { id: user.id },
            data: { metadata },
        });

        const payload: JwtPayload = {
            sub: user.id,
            walletAddress: normalizedAddress,
            tier: user.reputationTier,
        };

        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            profile: {
                id: user.id,
                walletAddress: normalizedAddress,
                tier: user.reputationTier,
                reputationScore: user.reputationPoints,
            },
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                loans: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async validateJwtPayload(payload: JwtPayload) {
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            throw new UnauthorizedException('Invalid user');
        }

        const metadata = (user.metadata as any) || {};
        if (metadata.isBlocked) {
            throw new UnauthorizedException('User is blocked');
        }

        return user;
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
