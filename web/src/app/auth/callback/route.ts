import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // If there's no code, this isn't a valid auth request
  if (!code) {
    return new NextResponse('No code provided', { status: 400 });
  }

  // Check if this is a mobile app redirect
  const isMobileApp = requestUrl.searchParams.get('mobile') === 'true';
  
  if (isMobileApp) {
    // Redirect back to the mobile app with the auth code
    return NextResponse.redirect(`shadowpod://auth/callback?code=${code}`);
  }

  // Handle web app authentication
  try {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  } catch (error) {
    console.error('Error exchanging code for session:', error);
    return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
  }
} 