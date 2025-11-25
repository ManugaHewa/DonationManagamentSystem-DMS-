import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@dms/database';
import { UserRole } from '@prisma/client';
import { ApiResponse, AuthResponse } from '@dms/types';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import crypto from 'crypto';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, username, password, firstName, lastName, address, city, province, postalCode } = req.body;

      if (!email && !phone && !username) {
        return res.status(400).json({ success: false, message: 'Email, phone, or username is required' });
      }

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            email ? { email } : undefined,
            phone ? { phone } : undefined,
            username ? { username } : undefined,
          ].filter(Boolean) as any,
        },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email/phone/username',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS || '10'));

      // Create user with donor profile (inactive until admin approval)
      const user = await prisma.user.create({
        data: {
          email: email || null,
          phone: phone || null,
          username: username || null,
          password: hashedPassword,
          role: UserRole.DONOR,
          isActive: false,
          donor: {
            create: {
              firstName,
              lastName,
              email: email || undefined,
              mobile: phone || null,
              address,
              city,
              province,
              postalCode,
              country: 'Canada',
              isActive: false,
            },
          },
        },
        include: {
          donor: true,
        },
      });

      // Send verification email
      const verificationToken = this.generateVerificationToken(user.id);
      const verifyLink = `${process.env.WEB_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
      if (email) {
        await sendEmail({
          to: email,
          subject: 'Verify Your Email - DMS',
          html: `<p>Welcome to the Temple! Please verify your email by clicking this link: <a href="${verifyLink}">${verifyLink}</a></p>`,
        });
      }

      logger.info(`User registered: ${email}`);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          accessToken: '',
          refreshToken: '',
        },
        message: 'Registration successful. Check your email to verify, then wait for admin approval.',
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, username, identifier, password } = req.body;

      const searchValue = identifier || email || phone || username;

      if (!searchValue) {
        return res.status(400).json({ success: false, message: 'Email, phone, or username is required' });
      }

      // Find user by any identifier
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: searchValue },
            { phone: searchValue },
            { username: searchValue },
          ],
        },
        include: { donor: true },
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Require verified email only when an email exists
      if (user.role === UserRole.DONOR && user.email && !user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in.',
        });
      }

      // Check if user is active/approved
      // Allow login even if pending approval; downstream routes will enforce approval for protected actions

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user.id);

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      logger.info(`User logged in: ${email}`);

      const response: ApiResponse<AuthResponse> = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
          accessToken,
          refreshToken,
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await prisma.refreshToken.deleteMany({
          where: { token: refreshToken },
        });
      }

      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token required',
        });
      }

      // Verify refresh token
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired refresh token',
        });
      }

      // Generate new tokens
      const accessToken = this.generateAccessToken(storedToken.user);
      const newRefreshToken = await this.generateRefreshToken(storedToken.userId);

      // Delete old refresh token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await prisma.passwordReset.create({
        data: {
          email,
          token: resetToken,
          expiresAt,
        },
      });

      // Send email
      await sendEmail({
        to: email,
        subject: 'Password Reset Request - DMS',
        html: `<p>Click to reset your password: <a href="${process.env.WEB_URL}/reset-password?token=${resetToken}">Reset Password</a></p>
               <p>This link expires in 1 hour.</p>`,
      });

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;

      const resetToken = await prisma.passwordReset.findUnique({
        where: { token },
      });

      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token',
        });
      }

      // Update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email: resetToken.email },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const token = (req.body.token || req.query.token) as string | undefined;

      if (!token) {
        return res.status(400).json({ success: false, message: 'Verification token is required' });
      }

      const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
      if (payload.purpose !== 'email-verification') {
        return res.status(400).json({ success: false, message: 'Invalid verification token' });
      }

      const user = await prisma.user.update({
        where: { id: payload.userId },
        data: { emailVerified: true },
      });

      res.json({
        success: true,
        message: 'Email verified successfully. Pending admin approval.',
        data: { emailVerified: true, isActive: user.isActive },
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
      }
      next(error);
    }
  }

  async listUsers(req: Request, res: Response) {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, isActive: true, emailVerified: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  }

  async approveUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (existing.email && !existing.emailVerified) {
        return res.status(400).json({ success: false, message: 'User has not verified their email yet' });
      }

      if (existing.isActive) {
        return res.json({ success: true, data: { id: existing.id, isActive: true }, message: 'User already approved' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { isActive: true },
      });

      const donor = await prisma.donor.findUnique({ where: { userId: id } });
      if (donor) {
        await prisma.donor.update({ where: { id: donor.id }, data: { isActive: true } });
      }

      await sendEmail({
        to: user.email,
        subject: 'Your donor account has been approved',
        html: `<p>Your account has been approved by an administrator. You can now log in and make donations.</p>`,
      });

      res.json({ success: true, data: { id: user.id, isActive: true }, message: 'User approved' });
    } catch (error) {
      next(error);
    }
  }

  async deletePendingUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await prisma.user.findUnique({ where: { id }, include: { donor: true } });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.emailVerified) {
        return res.status(400).json({ success: false, message: 'Cannot delete a verified user' });
      }

      // Clean up donor profile if it exists
      if (user.donor) {
        await prisma.donor.delete({ where: { id: user.donor.id } });
      }

      await prisma.user.delete({ where: { id } });

      res.json({ success: true, message: 'Pending user removed' });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  private generateAccessToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private generateVerificationToken(userId: string): string {
    return jwt.sign(
      { userId, purpose: 'email-verification' },
      process.env.JWT_SECRET!,
      { expiresIn: '2d' }
    );
  }
}
