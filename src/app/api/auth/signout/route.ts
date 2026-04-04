import { NextResponse } from 'next/server';
import { auth, signOut } from '@/auth';

/**
 * Sign out endpoint - destroys the session and redirects to login
 */
export async function POST() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Use Auth.js v5's signOut to properly clear the session
  await signOut({ redirect: false });

  // Return success response - the client should redirect
  return NextResponse.json({ success: true, message: 'Signed out successfully', redirectUrl: '/login' });
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to sign out' }, { status: 405 });
}
