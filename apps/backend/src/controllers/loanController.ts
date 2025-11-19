import { Request, Response, NextFunction } from 'express';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  walletAddress?: string;
}

export const getLoansByUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { walletAddress } = req.params;
    
    const loans = await prisma.loan.findMany({
      where: {
        borrower: {
          walletAddress: walletAddress || req.walletAddress,
        },
      },
      include: {
        repayments: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: loans,
    });
  } catch (error) {
    logger.error('Error fetching loans', error);
    next(error);
  }
};

export const getLoanById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loanId } = req.params;
    
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        borrower: {
          select: {
            walletAddress: true,
            name: true,
            email: true,
          },
        },
        repayments: true,
      },
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        error: { message: 'Loan not found' },
      });
    }

    res.json({
      success: true,
      data: loan,
    });
  } catch (error) {
    logger.error('Error fetching loan', error);
    next(error);
  }
};

export const createLoan = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const walletAddress = req.walletAddress || req.body.borrower;
    
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: { message: 'Wallet address is required' },
      });
    }

    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress },
      });
    }

    const loan = await prisma.loan.create({
      data: {
        borrowerId: user.id,
        principalAmount: BigInt(req.body.principalAmount),
        remainingPrincipal: BigInt(req.body.principalAmount),
        interestAccrued: BigInt(0),
        lateFee: BigInt(0),
        interestRateBps: req.body.interestRateBps,
        dueDate: new Date(req.body.dueDate),
        status: req.body.status || 'PENDING',
        tokenType: req.body.tokenType,
        purpose: req.body.purpose,
        collateralAddress: req.body.collateralAddress,
        collateralAmount: BigInt(req.body.collateralAmount || 0),
        chainId: req.body.chainId,
        txHash: req.body.txHash,
      },
    });

    res.status(201).json({
      success: true,
      data: loan,
    });
  } catch (error) {
    logger.error('Error creating loan', error);
    next(error);
  }
};

export const updateLoanStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loanId } = req.params;
    const { status } = req.body;

    const loan = await prisma.loan.update({
      where: { id: loanId },
      data: { status },
    });

    res.json({
      success: true,
      data: loan,
    });
  } catch (error) {
    logger.error('Error updating loan', error);
    next(error);
  }
};

