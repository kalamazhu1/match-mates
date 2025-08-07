'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * Test page for Supabase client connection
 * Visit: http://localhost:3000/test-supabase
 */
export default function TestSupabasePage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testClientConnection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing Supabase client connection...');

      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Environment variables not configured');
      }

      if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your_supabase_anon_key_here')) {
        throw new Error('Environment variables contain placeholder values');
      }

      // Create client and test connection
      const supabase = createClient();
      
      // Test auth session
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

      setTestResult({
        success: true,
        connection: {
          supabaseUrl,
          authenticated: !!session,
          database: {
            status: databaseStatus,
            error: databaseError
          }
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      setTestResult({
        success: false,
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  const testServerConnection = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/test-supabase');
      const result = await response.json();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: (error as Error).message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6">Supabase Connection Test</h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-600">
              Use this page to test your Supabase connection configuration.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> Make sure you've configured your environment variables in <code>.env.local</code> before testing.
              </p>
            </div>
          </div>

          <div className="space-x-4 mb-8">
            <button
              onClick={testClientConnection}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Client Connection'}
            </button>
            
            <button
              onClick={testServerConnection}
              disabled={loading}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Server Connection'}
            </button>
          </div>

          {testResult && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              
              {testResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-green-600 text-2xl mr-2">✅</span>
                    <span className="text-green-800 font-semibold">Connection Successful!</span>
                  </div>
                  
                  <div className="mt-4 text-sm text-green-700">
                    <div><strong>Supabase URL:</strong> {testResult.connection.supabaseUrl}</div>
                    <div><strong>Authenticated:</strong> {testResult.connection.authenticated ? 'Yes' : 'No'}</div>
                    <div><strong>Database Status:</strong> {testResult.connection.database.status}</div>
                    {testResult.connection.database.error && (
                      <div className="mt-2 p-2 bg-yellow-100 rounded text-yellow-800">
                        <strong>Database Note:</strong> {testResult.connection.database.error}
                      </div>
                    )}
                    <div><strong>Tested at:</strong> {testResult.timestamp}</div>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-red-600 text-2xl mr-2">❌</span>
                    <span className="text-red-800 font-semibold">Connection Failed</span>
                  </div>
                  
                  <div className="mt-4 text-sm text-red-700">
                    <strong>Error:</strong> {testResult.error}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded text-blue-800 text-sm">
                    <strong>Troubleshooting:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Check that your <code>.env.local</code> file exists and has the correct values</li>
                      <li>Verify your Supabase project URL and API keys</li>
                      <li>Make sure your Supabase project is active</li>
                      <li>Check the browser console for additional error details</li>
                    </ul>
                  </div>
                </div>
              )}
              
              <details className="mt-4">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                  View Raw Response
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}