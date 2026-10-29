import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../data/store.ts';
import { UserRole, IUser } from '../models/types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'mealbridge-belagavi-secure-jwt-key';

export interface AuthRequest extends Request {
  user?: IUser;
}

export function generateToken(user: IUser): string {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: UserRole };
    const user = store.users.find((u) => u._id === decoded.id);

    if (!user) {
      res.status(401).json({ success: false, error: 'User associated with token no longer exists.' });
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED' || user.status === 'REJECTED') {
      res.status(403).json({
        success: false,
        error: `Account access restricted. Your current account status is: ${user.status}. Please contact the Belagavi administrative office.`,
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired authentication token.' });
    return;
  }
}

export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access forbidden. Role '${req.user.role}' is not authorized to access this operational resource.`,
      });
      return;
    }

    next();
  };
}
