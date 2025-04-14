import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GeneratedContent } from '@/lib/types';

// Create a new Supabase client for each request with the provided Auth token
const getSupabaseClient = (authToken: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Debug environment variables (masking for security)
  console.log("API route: Environment check:", {
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseAnonKey: !!supabaseAnonKey,
    urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 10) + '...' : 'undefined',
  });
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Create and return client
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function POST(request: NextRequest) {
  try {
    console.log('API route: Content generation request received');
    
    // Get auth token from the request headers
    const authToken = request.headers.get('x-auth-token');
    if (!authToken) {
      console.error('No auth token provided in request headers');
      return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
    }
    
    console.log('API route: Auth token received, creating Supabase client');
    
    // Create a Supabase client with the auth token
    const supabase = getSupabaseClient(authToken);
    
    // Verify the token by checking the user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Invalid authentication token', details: userError }, { status: 401 });
    }
    
    if (!user) {
      console.error('No user found with provided token');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    console.log('API route: Authenticated as user:', user.id);
    
    // Parse request body
    const body = await request.json();
    const { vocab, grammar, wanikaniLevel } = body;
    
    if (!vocab?.length || !grammar?.length || !wanikaniLevel) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    console.log('API route: Request parameters validated');
    
    try {
      console.log('API route: Calling edge function with params:', {
        vocabCount: vocab.length,
        grammarCount: grammar.length,
        wanikaniLevel
      });
      
      // Call Supabase Edge Function to generate content
      const { data, error } = await supabase.functions.invoke<GeneratedContent>('generate-content', {
        body: { vocab, grammar, wanikaniLevel },
      });
      
      if (error) {
        console.error('Edge function error:', error);
        return NextResponse.json({ 
          error: 'Failed to generate content', 
          details: error,
          message: error.message,
          name: error.name,
          context: error.context
        }, { status: 500 });
      }
      
      if (!data) {
        console.error('No data returned from edge function');
        return NextResponse.json({ error: 'No content generated' }, { status: 500 });
      }
      
      console.log('API route: Content generated successfully');
      return NextResponse.json(data);
    } catch (functionError) {
      console.error('Error invoking edge function:', functionError);
      return NextResponse.json({ 
        error: 'Edge function invocation failed', 
        details: functionError instanceof Error ? functionError.message : String(functionError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 