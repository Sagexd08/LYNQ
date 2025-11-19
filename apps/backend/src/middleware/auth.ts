import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  walletAddress?: string;
  userRoles?: string[];
  userId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'No token provided' },
      });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, JWT_SECRET) as { walletAddress: string; roles?: string[]; userId?: string };
    req.walletAddress = decoded.walletAddress;
    req.userRoles = decoded.roles || ['user'];
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
  }
};

export const requireRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const userRoles = req.userRoles || ['user'];
    const allowed = roles.length === 0 || roles.some(r => userRoles.includes(r));
    if (!allowed) {
      return res.status(403).json({
        success: false,
        error: { message: 'Forbidden: insufficient role' },
      });
    }
    next();
  };
};

export const generateToken = (walletAddress: string, roles: string[] = ['user'], userId?: string): string => {
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  return jwt.sign({ walletAddress, roles, userId }, JWT_SECRET, { expiresIn: '7d' });
};

