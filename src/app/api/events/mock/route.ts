import { NextRequest, NextResponse } from 'next/server'
import { createEventSchema } from '@/lib/validations/event'
import { ZodError } from 'zod'

// DEPRECATED: This endpoint is no longer used. Use /api/events instead.
export async function POST(request: NextRequest) {
  try {
    // Parse the request body (for validation, but endpoint is deprecated)
    await request.json()

    // Return deprecation notice immediately
    return NextResponse.json(
      { 
        error: 'This mock endpoint has been deprecated. Please use /api/events instead.',
        redirectTo: '/api/events'
      },
      { status: 410 }
    )

  } catch (error) {
    console.error('Mock event creation error:', error)
    
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.issues
        },
        { status: 400 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}