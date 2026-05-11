import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma'
import { generateToken } from '../lib/jwt'
import { AppError } from '../middleware/errorHandler'

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, name, password } = req.body

    // Validate required fields
    if (!email || !name || !password) {
      throw new AppError('Email, name and password are required', 400)
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400)
    }

    if (!/[A-Z]/.test(password)) {
      throw new AppError('Password must contain at least one capital letter', 400)
    }
    if (!/[0-9]/.test(password)) {
      throw new AppError('Password must contain at least one number', 400)
    }
    if (!/[!@#$%^&*]/.test(password)) {
      throw new AppError('Password must contain at least one special character', 400)
    }

    // Check if email is already taken
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      throw new AppError('Email already in use', 409)
    }

    // Hash the password — never store plain text
    // 12 is the salt rounds — higher is more secure but slower
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        // New registrations are always customers
        // Admins must manually promote users to AGENT or ADMIN
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    res.status(201).json({
      data: { user, token },
    })

  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    // Find user including password for comparison
    const user = await prisma.user.findUnique({ where: { email } })

    // Use the same error message whether email or password is wrong
    // Telling the user which one is wrong is a security leak
    if (!user) {
      throw new AppError('Invalid email or password', 401)
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      throw new AppError('Invalid email or password', 401)
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    res.json({
      data: {
        user: userWithoutPassword,
        token,
      },
    })

  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // req.user is already set by authenticate middleware
    // Just return it — no extra database query needed
    res.json({ data: req.user })
  } catch (err) {
    next(err)
  }
}