import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseConfig } from '@/lib/env';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const protectedRoute = ['/admin', '/onboarding'].some(
    p => pathname === p || pathname.startsWith(p + '/')
  );
  const isAuthPage = (pathname === '/auth' || pathname.startsWith('/auth/')) && !pathname.startsWith('/auth/callback');

  const configuration = supabaseConfig();
  if (!configuration) return protectedRoute ? NextResponse.redirect(new URL('/setup', request.url)) : response;

  const client = createServerClient(configuration.url, configuration.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          })
        );
      }
    }
  });

  const { data: { user } } = await client.auth.getUser();

  if (isAuthPage && user) {
    const redirect = NextResponse.redirect(new URL('/app', request.url));
    response.cookies.getAll().forEach(c => redirect.cookies.set(c));
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }

  if (protectedRoute && !user) {
    const target = new URL('/auth/sign-in', request.url);
    target.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    const redirect = NextResponse.redirect(target);
    response.cookies.getAll().forEach(c => redirect.cookies.set(c));
    redirect.headers.set('Cache-Control', 'private, no-store');
    return redirect;
  }

  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/app/:path*', '/onboarding', '/admin/:path*', '/auth', '/auth/:path*', '/counselors/:path*'] };

