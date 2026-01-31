import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  walletAddress?: string;
}

export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const walletAddress = req.walletAddress;
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    logger.error('Error fetching notifications', error);
    next(error);
  }
};

export const updateNotificationSettings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const walletAddress = req.walletAddress;
    
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    const settings = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
      update: req.body,
      create: {
        userId: user.id,
        ...req.body,
      },
    });

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    logger.error('Error updating notification settings', error);
    next(error);
  }
};

export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error marking notification as read', error);
    next(error);
  }
};

