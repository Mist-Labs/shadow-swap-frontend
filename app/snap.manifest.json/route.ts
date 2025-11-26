import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const manifestPath = join(process.cwd(), 'public', 'snap', 'snap.manifest.json')
    const manifest = readFileSync(manifestPath, 'utf-8')
    return NextResponse.json(JSON.parse(manifest), {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Error serving snap manifest:', error)
    return NextResponse.json(
      { error: 'Snap manifest not found' },
      { status: 404 }
    )
  }
}

