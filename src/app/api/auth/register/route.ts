import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/token'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username } = body

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { username: username.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const loginToken = 'login_' + generateToken('')

    const user = await db.user.create({
      data: {
        username: username.trim(),
        loginToken,
      },
    })

    return NextResponse.json({
      success: true,
      username: user.username,
      loginToken: user.loginToken,
      createdAt: user.createdAt,
    })
  } catch (error: any) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
