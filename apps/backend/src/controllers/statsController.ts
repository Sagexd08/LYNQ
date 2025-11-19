import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const getPlatformStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalLoans = await prisma.loan.count();
    const activeLoans = await prisma.loan.count({ where: { status: 'ACTIVE' } });
    const defaultedLoans = await prisma.loan.count({ where: { status: 'DEFAULTED' } });
    const totalUsers = await prisma.user.count();

    const loans = await prisma.loan.findMany({
      select: {
        principalAmount: true,
        remainingPrincipal: true,
        interestRateBps: true,
      },
    });

    const totalAmountLent = loans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);
    const totalRepaid = loans.reduce((sum, loan) => sum + (Number(loan.principalAmount) - Number(loan.remainingPrincipal)), 0);
    const averageInterestRate = loans.length > 0 
      ? loans.reduce((sum, loan) => sum + loan.interestRateBps, 0) / loans.length 
      : 0;
    const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

    const stats = {
      totalLoans,
      activeLoans,
      defaultedLoans,
      totalUsers,
      totalAmountLent: totalAmountLent.toString(),
      totalRepaid: totalRepaid.toString(),
      averageInterestRate,
      defaultRate,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error fetching platform stats', error);
    next(error);
  }
};

