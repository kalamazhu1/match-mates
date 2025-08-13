import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

    // Create Supabase admin client (service role)
    const supabase = createAdminClient()

    // Insert user profile using service role privileges
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