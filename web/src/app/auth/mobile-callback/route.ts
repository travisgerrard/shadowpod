import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('--- [Mobile Callback Route] GET request received! ---');
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;
  console.log('[Mobile Callback Route] Full URL:', requestUrl.toString());
  console.log('[Mobile Callback Route] Search Params:', searchParams.toString());

  // Extract the 'return_to' parameter (the mobile deep link)
  const returnTo = searchParams.get('return_to');

  if (!returnTo) {
    console.error('[Mobile Callback Route] Error: "return_to" parameter missing!');
    return new NextResponse(
      'Error: Missing "return_to" parameter. Cannot redirect back to the mobile app.',
      { status: 400 }
    );
  }

  console.log('[Mobile Callback Route] Extracted mobile return URL:', returnTo);

  // Construct the final mobile URL by appending all *other* search params
  const mobileUrl = new URL(returnTo);
  searchParams.forEach((value, key) => {
    if (key !== 'return_to') { // Don't append the return_to param itself
      mobileUrl.searchParams.append(key, value);
    }
  });

  console.log('[Mobile Callback Route] Redirecting to mobile URL:', mobileUrl.toString());

  // Redirect the browser to the mobile app's deep link
  return NextResponse.redirect(mobileUrl.toString(), 302);
}