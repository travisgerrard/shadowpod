import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a new Supabase client for each request with the provided Auth token
const getSupabaseClient = (authToken: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
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
    console.log('API route: Audio transcription request received');
    
    // Get auth token from the request headers
    const authToken = request.headers.get('x-auth-token');
    if (!authToken) {
      console.error('No auth token provided in request headers');
      return NextResponse.json({ error: 'Authentication token required' }, { status: 401 });
    }
    
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
    
    // Get the audio data from the request
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const language = formData.get('language') as string || 'ja'; // Default to Japanese
    
    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // The OpenAI Whisper API requires multipart/form-data
    const formDataForOpenAI = new FormData();
    formDataForOpenAI.append('file', audioBlob, 'recording.webm');
    formDataForOpenAI.append('model', 'whisper-1');
    formDataForOpenAI.append('language', language);
    
    // Call the OpenAI Whisper API
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'OpenAI API key is not configured' }, { status: 500 });
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formDataForOpenAI,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ 
          error: 'OpenAI API request failed', 
          details: errorData 
        }, { status: response.status });
      }
      
      const result = await response.json();
      
      // Return the transcription result
      return NextResponse.json({
        transcript: result.text,
        success: true
      });
    } catch (apiError) {
      console.error('Error calling OpenAI Whisper API:', apiError);
      return NextResponse.json({ 
        error: 'Failed to transcribe audio', 
        details: apiError instanceof Error ? apiError.message : String(apiError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing transcription request:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 