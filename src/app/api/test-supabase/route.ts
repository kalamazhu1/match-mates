import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to test Supabase connection
 * GET /api/test-supabase
 */
export async function GET() {
  try {
    console.log('🧪 Testing Supabase server connection...');

    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured',
        missing: {
          url: !supabaseUrl,
          anonKey: !supabaseAnonKey
        }
      }, { status: 500 });
    }

    if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables contain placeholder values'
      }, { status: 500 });
    }

    // Create Supabase client using server helper
    const supabase = await createClient();
    
    // Test basic connection
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message !== 'Auth session missing!') {
      throw authError;
    }
    
    // Test database access
    let databaseStatus = 'unknown';
    let databaseError = null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        databaseStatus = 'error';
        databaseError = error.message;
      } else {
        databaseStatus = 'connected';
      }
    } catch (error) {
      databaseStatus = 'error';
      databaseError = (error as Error).message;
    }
    
    return NextResponse.json({
      success: true,
      connection: {
        supabaseUrl: supabaseUrl,
        authenticated: !!session,
        database: {
          status: databaseStatus,
          error: databaseError
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}