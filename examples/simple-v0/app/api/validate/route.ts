import { NextResponse } from 'next/server'

const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY
const OPENCODE_API_URL = 'https://opencode.ai/zen/v1/chat/completions'

export async function GET() {
  try {
    if (!OPENCODE_API_KEY) {
      return NextResponse.json(
        {
          valid: false,
          error: 'API_KEY_MISSING',
          message: 'OpenCode API key is not configured',
        },
        { status: 401 },
      )
    }

    const response = await fetch(OPENCODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCODE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'minimax-m2.5-free',
        messages: [
          { role: 'user', content: 'Hi' }
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        {
          valid: false,
          error: 'API_KEY_INVALID',
          message: errorData.error || `OpenCode API error: ${response.status}`,
        },
        { status: 401 },
      )
    }

    return NextResponse.json({
      valid: true,
      message: 'OpenCode API key is configured correctly',
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        {
          valid: false,
          error: 'VALIDATION_ERROR',
          message: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        valid: false,
        error: 'UNKNOWN_ERROR',
        message: 'Unknown error occurred during validation',
      },
      { status: 500 },
    )
  }
}
