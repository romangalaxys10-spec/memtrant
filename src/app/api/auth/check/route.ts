import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get('username')

    if (!username) {
      return NextResponse.json({ error: 'Username query parameter required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { username } })

    return NextResponse.json({ exists: !!user })
  } catch (error: any) {
    console.error('Check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
