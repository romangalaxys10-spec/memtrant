import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateToken } from '@/lib/token'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, loginToken: customToken } = body

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return NextResponse.json({ error: 'Username must be at least 2 characters' }, { status: 400 })
    }

    const trimmedUsername = username.trim()

    const existingUser = await db.user.findUnique({ where: { username: trimmedUsername } })
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    // Determine login token: use custom if provided and valid, otherwise auto-generate
    let loginToken: string
    if (customToken && typeof customToken === 'string' && customToken.trim().length >= 8) {
      const trimmed = customToken.trim()
      // Check uniqueness
      const existingToken = await db.user.findUnique({ where: { loginToken: trimmed } })
      if (existingToken) {
        return NextResponse.json({ error: 'This token is already taken. Choose another.' }, { status: 409 })
      }
      loginToken = trimmed
    } else {
      loginToken = 'login_' + generateToken('')
    }

    const user = await db.user.create({
      data: {
        username: trimmedUsername,
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
