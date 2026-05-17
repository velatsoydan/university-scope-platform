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

    if (!email.endsWith('.edu.tr') && !email.endsWith('.edu')) {
      res.status(400).json({ error: 'Access denied: Please use your official university email address.' });
      return;
    }

    if (role === 'STUDENT') {
      if (!/@st\..*\.edu(\.tr)?$/.test(email)) {
        res.status(400).json({ error: 'Students must use their @st.university.edu email address.' });
        return;
      }
    } else if (role === 'INSTRUCTOR') {
      if (/@st\./.test(email)) {
        res.status(400).json({ error: 'Advisors must use their official staff email address.' });
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
      if (!/@st\..*\.edu(\.tr)?$/.test(email)) {
        res.status(400).json({ error: 'Students must use their @st.university.edu email address.' });
        return;
      }
    } else if (user.role === 'INSTRUCTOR') {
      if (/@st\./.test(email)) {
        res.status(400).json({ error: 'Advisors must use their official staff email address.' });
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
