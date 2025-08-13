import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Try to get all users to debug RLS
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, ntrp_level')
      .limit(20)
    
    // Try specific user ID from registration
    const testUserId = '646ecadf-e5eb-4f6b-b909-6c34cd7e5b65'
    const { data: specificUser, error: specificError } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single()
    
    // Test join query
    const { data: joinTest, error: joinError } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        status,
        user:users!user_id(name, email, ntrp_level)
      `)
      .eq('event_id', '07b63d59-1314-4b84-bab6-8e99666b46aa')
      .limit(3)
    
    // Get current user info
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    return NextResponse.json({
      debug: {
        currentUser: currentUser?.id || 'not authenticated',
        usersQuery: {
          data: users,
          error: usersError,
          count: users?.length || 0
        },
        specificUserQuery: {
          data: specificUser,
          error: specificError
        },
        joinQuery: {
          data: joinTest,
          error: joinError,
          count: joinTest?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}