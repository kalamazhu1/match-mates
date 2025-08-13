import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, email, name, ntrp_level, phone } = await request.json()

    // Validate required fields
    if (!userId || !email || !name || !ntrp_level) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Insert user profile
    const { error } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: email,
        name: name.trim(),
        ntrp_level: ntrp_level,
        phone: phone?.trim() || null
      }])

    if (error) {
      console.error('Profile creation error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Handle specific database errors
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'User profile already exists', details: error },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create user profile', details: error },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'User profile created successfully' },
      { status: 201 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}