import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { Role } from '@prisma/client';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable is not set.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_super_secret_key';

const VALID_ROLES: Role[] = ['STUDENT', 'INSTRUCTOR', 'ADMIN'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name || !role) {
      res.status(400).json({ error: 'Missing required fields: email, password, name, and role are required' });
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (!email.endsWith(".edu.tr")) {
      res.status(400).json({ error: 'Access denied: Please use your official @uskudar.edu.tr university email address.' });
      return;
    }

    if (role === 'STUDENT') {
      if (!/@st\..*\.edu\.tr$/.test(email)) {
        res.status(400).json({ error: 'Students must use their @st.uskudar.edu.tr email address.' });
        return;
      }
    } else if (role === 'INSTRUCTOR') {
      if (/@st\./.test(email)) {
        res.status(400).json({ error: 'Advisors must use their official staff email (e.g. name@uskudar.edu.tr).' });
        return;
      }
    }

    if (typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    if (!VALID_ROLES.includes(role as Role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'Email is already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User and their respective Profile in a Transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role as Role,
        },
      });

      if (role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
          },
        });
      } else if (role === 'INSTRUCTOR') {
        await tx.advisorProfile.create({
          data: {
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'An error occurred during registration' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Missing email or password' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.role === 'STUDENT') {
      if (!/@st\..*\.edu\.tr$/.test(email)) {
        res.status(400).json({ error: 'Students must use their @st.uskudar.edu.tr email address.' });
        return;
      }
    } else if (user.role === 'INSTRUCTOR') {
      if (/@st\./.test(email)) {
        res.status(400).json({ error: 'Advisors must use their official staff email (e.g. name@uskudar.edu.tr).' });
        return;
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return generic message to prevent email enumeration
    if (user) {
      const resetToken = jwt.sign(
        { userId: user.id, purpose: 'password-reset' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      console.log('\n======================================');
      console.log('  PASSWORD RESET LINK (dev only):');
      console.log(`  ${resetLink}`);
      console.log('======================================\n');
    }

    res.status(200).json({
      message: 'If an account with that email exists, a reset link has been generated. Check the backend terminal.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' });
      return;
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    let payload: { userId: string; purpose: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { userId: string; purpose: string };
    } catch {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }

    if (payload.purpose !== 'password-reset') {
      res.status(400).json({ error: 'Invalid token purpose' });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
};
