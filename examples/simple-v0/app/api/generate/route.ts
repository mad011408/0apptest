import { NextRequest, NextResponse } from 'next/server'
import {
  checkRateLimit,
  getUserIdentifier,
  getUserIP,
} from '@/lib/rate-limiter'

const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY
const OPENCODE_API_URL = 'https://opencode.ai/zen/v1/chat/completions'

const AVAILABLE_MODELS = ['minimax-m2.5-free', 'kimi-k2.5-free']

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      chatId,
      modelId = 'minimax-m2.5-free',
      attachments = [],
    } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 },
      )
    }

    if (!AVAILABLE_MODELS.includes(modelId)) {
      return NextResponse.json(
        { error: `Invalid model. Available models: ${AVAILABLE_MODELS.join(', ')}` },
        { status: 400 },
      )
    }

    const userIdentifier = getUserIdentifier(request)
    const rateLimitResult = await checkRateLimit(userIdentifier)

    if (!rateLimitResult.success) {
      const resetTime = rateLimitResult.resetTime.toLocaleString()
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: `You've reached the limit of 3 generations per 12 hours. Please try again after ${resetTime}.`,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          },
        },
      )
    }

    if (!OPENCODE_API_KEY) {
      return NextResponse.json(
        { error: 'API_KEY_MISSING', message: 'OpenCode API key is not configured' },
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
        model: modelId,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI coding assistant. Always provide code examples when possible.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'API_ERROR', message: errorData.error || `OpenCode API error: ${response.status}` },
        { status: response.status },
      )
    }

    const data = await response.json()

    return NextResponse.json({
      id: chatId || `chat-${Date.now()}`,
      message: {
        role: 'assistant',
        content: data.choices?.[0]?.message?.content || data.content || 'No response',
      },
      model: modelId,
      created: Date.now(),
    })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to generate: ${error.message}` },
        { status: 500 },
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate. Please try again.' },
      { status: 500 },
    )
  }
}
