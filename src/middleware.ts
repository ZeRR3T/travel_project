import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Простая проверка - если нет токена, withAuth автоматически перенаправит на /login
    // Дополнительная логика не нужна
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Проверяем cookies
        const cookies = req.cookies;
        const sessionToken = cookies.get('__Secure-next-auth.session-token') || cookies.get('next-auth.session-token');
        const csrfToken = cookies.get('__Host-next-auth.csrf-token') || cookies.get('next-auth.csrf-token');
        
        console.log(' Middleware Check:', {
          pathname,
          hasToken: !!token,
          tokenId: token?.id,
          environment: process.env.NODE_ENV,
          hasSessionCookie: !!sessionToken,
          hasCsrfCookie: !!csrfToken,
          sessionCookieValue: sessionToken?.value ? 'present' : 'missing',
          csrfCookieValue: csrfToken?.value ? 'present' : 'missing'
        });
        
        // Middleware should not protect API routes, let them handle their own auth
        if (pathname.startsWith('/api/')) {
          console.log(' API route, allowing access');
          return true;
        }

        // For protected pages, require a token
        if (pathname.startsWith('/dashboard') || 
            pathname.startsWith('/account') ||
            pathname.startsWith('/balance') ||
            pathname.startsWith('/bookings') ||
            pathname.startsWith('/transactions') ||
            pathname.startsWith('/hotels') ||
            pathname.startsWith('/flights') ||
            pathname.startsWith('/car-rental') ||
            pathname.startsWith('/taxi') ||
            pathname.startsWith('/payment-success') ||
            pathname.startsWith('/reset-balance')) {
          console.log(' Protected route, token required:', !!token);
          return !!token;
        }

        // Allow all other page requests
        console.log(' Public route, allowing access');
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
