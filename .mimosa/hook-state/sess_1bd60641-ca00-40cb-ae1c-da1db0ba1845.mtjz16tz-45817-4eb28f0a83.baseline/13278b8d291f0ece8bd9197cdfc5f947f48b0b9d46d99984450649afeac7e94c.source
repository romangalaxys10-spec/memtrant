import { NextRequest, NextResponse } from 'next/server'
import { authenticateAgent } from '@/lib/auth'
import { readFileContent, writeFileContent, deleteFileOrDir } from '@/lib/storage'

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string; path: string[] }> }) {
  try {
    const { slug, path: pathSegments } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filePath = pathSegments.join('/')
    const content = await readFileContent(slug, filePath)

    if (content === null) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (error: any) {
    console.error('Read memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string; path: string[] }> }) {
  try {
    const { slug, path: pathSegments } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filePath = pathSegments.join('/')
    const content = await req.text()

    await writeFileContent(slug, filePath, content)

    return NextResponse.json({ success: true, path: filePath })
  } catch (error: any) {
    console.error('Write memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string; path: string[] }> }) {
  try {
    const { slug, path: pathSegments } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filePath = pathSegments.join('/')

    // Check if file upload (binary)
    const contentType = req.headers.get('content-type') || ''
    if (contentType.startsWith('multipart/') || !contentType.includes('text')) {
      const buffer = Buffer.from(await req.arrayBuffer())
      const { writeFileBinary } = await import('@/lib/storage')
      await writeFileBinary(slug, filePath, buffer)
      return NextResponse.json({ success: true, path: filePath, type: 'binary' })
    }

    // Text content
    const content = await req.text()
    await writeFileContent(slug, filePath, content)

    return NextResponse.json({ success: true, path: filePath, type: 'text' }, { status: 201 })
  } catch (error: any) {
    console.error('Create memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string; path: string[] }> }) {
  try {
    const { slug, path: pathSegments } = await params
    const auth = await authenticateAgent(req)
    if (!auth || auth.team.slug !== slug) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const filePath = pathSegments.join('/')
    const deleted = await deleteFileOrDir(slug, filePath)

    if (!deleted) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete memory error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
