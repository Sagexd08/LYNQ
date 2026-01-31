import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  walletAddress?: string;
}

export const getUserByWallet = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress } = req.params;
    
    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        trustScores: {
          orderBy: { lastUpdated: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress },
        include: {
          trustScores: true,
        },
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error fetching user', error);
    next(error);
  }
};

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress } = req.params;
    const { email, name } = req.body;

    const user = await prisma.user.update({
      where: { walletAddress },
      data: { email, name },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Error updating user', error);
    next(error);
  }
};

export const getTrustScore = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    let trustScore = await prisma.trustScore.findUnique({
      where: { userId: user.id },
    });

    if (!trustScore) {
      trustScore = await prisma.trustScore.create({
        data: { userId: user.id },
      });
    }

    res.json({
      success: true,
      data: trustScore,
    });
  } catch (error) {
    logger.error('Error fetching trust score', error);
    next(error);
  }
};

